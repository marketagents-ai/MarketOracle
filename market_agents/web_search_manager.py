import asyncio
import json
import logging
import os
import random
import threading
import uuid
import re
import time
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import yaml
from googlesearch import search
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from market_agents.inference.message_models import LLMConfig, LLMOutput, LLMPromptContext
from market_agents.inference.parallel_inference import ParallelAIUtilities, RequestLimits

# Set up logging
logger = logging.getLogger(__name__)
class WebSearchConfig(BaseSettings):
    query: str = "default search query"
    max_concurrent_requests: int = 50
    rate_limit: float = 0.1
    content_max_length: int = 1000000
    request_timeout: int = 30
    urls_per_query: int = 9
    use_ai_summary: bool = True 
    methods: List[str] = ["selenium", "playwright", "beautifulsoup", "newspaper3k", "scrapy", 
                         "requests_html", "mechanicalsoup", "httpx"]
    default_method: str = "newspaper3k"
    headers: Dict[str, str] = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    }
    llm_configs: Dict[str, Dict[str, Any]]

    
class SearchManager:
    def __init__(self, ai_utils, config: WebSearchConfig, prompts: Dict):
        self.ai_utils = ai_utils
        self.config = config
        self.prompts = prompts
        self.last_request_time = 0
        self.request_delay = 5
        self.max_retries = 3
        self.headers = config.headers
        self.search_params = {
            'num': self.config.urls_per_query,
            'stop': self.config.urls_per_query,
            'pause': 2.0,
            'user_agent': self.headers['User-Agent']
        }
        self.query_url_mapping = {}
        
    async def generate_search_queries(self, base_query: str) -> List[str]:
        try:
            # Get config from llm_configs
            llm_config_dict = self.config.llm_configs["search_query_generation"].copy()
            
            # Parse the YAML content properly
            search_query_section = yaml.safe_load(self.prompts["search_query_generation"])
            
            # Get system prompt and template from parsed YAML
            system_prompt = search_query_section["system_prompt"]
            prompt_template = search_query_section["prompt_template"]
            
            # Remove non-LLMConfig fields before creating LLMConfig
            llm_config_dict.pop('system_prompt', None)
            llm_config_dict.pop('prompt_template', None)
            
            # Create and validate LLMConfig
            llm_config = LLMConfig(**llm_config_dict)
                        # Get current date information
            current_date = datetime.now()
            current_year = current_date.year
            current_month = current_date.strftime("%B") 
            
            # Format the prompt using the template
            prompt = prompt_template.format(
                query=base_query,
                current_year=current_year,
                current_month=current_month
            )
            
            # Create prompt context
            context = LLMPromptContext(
                id=str(uuid.uuid4()),
                system_string=system_prompt,
                new_message=prompt,
                llm_config=llm_config.dict(),
                use_history=False
            )
            

            
            # Enhance base query with time context
            time_context = f"""
            Time Context:
            - Current Year: {current_year}
            - Current Month: {current_month}
            
            Please generate TWO search queries that:
            1. Include specific time frames (e.g., "2024 Q1", "December 2023", "last 30 days")
            2. Focus on recent developments and trends
            3. Include terms like "latest", "recent", "current", "upcoming"
            4. Consider both immediate news and short-term historical context
            
            Base Query: {base_query}
            """
            
            # Format the prompt using the template from config with enhanced context
            prompt = self.prompts["search_query_generation"].format(
                query=time_context
            )
            
            logger.info(f"Using prompt template with time context:\n{prompt}")
            

            responses = await self.ai_utils.run_parallel_ai_completion([context])
            
            if responses and len(responses) > 0:
                # Get response content
                response_text = responses[0].str_content
                
                if not response_text:
                    logger.error("No response content found")
                    time_modified_query = f"{base_query} {datetime.now().year} {datetime.now().strftime('%B')} latest"
                    return [time_modified_query]

                logger.info(f"AI Response:\n{response_text}")
                
                # Extract queries from text response
                queries = []
                for line in response_text.split('\n'):
                    line = line.strip()
                    if line and not any(line.startswith(x) for x in ['Query:', 'Please', 'Format', 'Make']):
                        # Clean up the line
                        cleaned_query = re.sub(r'^\d+\.\s*', '', line)  # Remove numbering
                        cleaned_query = re.sub(r'^[-•]\s*', '', cleaned_query)  # Remove bullet points
                        if cleaned_query:
                            queries.append(cleaned_query)
                
                # Ensure time context
                current_year = datetime.now().year
                current_month = datetime.now().strftime("%B")
                time_indicators = [str(current_year), current_month, "latest", "recent", "current", "last"]
                
                # Process and validate queries
                validated_queries = []
                for query in queries:
                    if not any(indicator.lower() in query.lower() for indicator in time_indicators):
                        query = f"{query} {current_year} latest"
                    validated_queries.append(query)
                
                # Add time-modified base query if needed
                time_modified_base = base_query
                if not any(str(current_year) in q for q in [base_query] + validated_queries):
                    time_modified_base = f"{base_query} {current_year} latest"
                
                # Combine queries and ensure uniqueness
                all_queries = [time_modified_base] + [q for q in validated_queries if q != time_modified_base]
                
                # Log the generated queries
                logger.info("\n=== Generated Search Queries with Time Context ===")
                logger.info(f"Original Query: {base_query}")
                logger.info(f"Time-Modified Base Query: {time_modified_base}")
                logger.info(f"Additional Queries Generated: {len(validated_queries)}")
                logger.info("\nAll Queries:")
                for i, query in enumerate(all_queries, 1):
                    logger.info(f"{i}. {query}")
                
                return all_queries[:self.config.urls_per_query]  # Limit number of queries
                    
        except Exception as e:
            logger.error(f"Error generating search queries: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Return base query with time context as fallback
            time_modified_query = f"{base_query} {datetime.now().year} latest"
            return [time_modified_query]
        
    def get_urls_for_query(self, query: str, num_results: int = 2) -> List[str]:
        """Get URLs from Google search with retry logic"""
        for attempt in range(self.max_retries):
            try:
                current_time = time.time()
                time_since_last_request = current_time - self.last_request_time
                if time_since_last_request < self.request_delay:
                    sleep_time = self.request_delay - time_since_last_request
                    logger.info(f"Rate limiting: sleeping for {sleep_time:.2f} seconds")
                    time.sleep(sleep_time)
                
                urls = list(search(
                    query,
                    num=num_results,
                    stop=num_results,
                    pause=self.search_params['pause']
                ))
                
                self.last_request_time = time.time()
                
                if urls:
                    logger.info(f"\n=== URLs Found ===")
                    logger.info(f"Query: {query}")
                    for i, url in enumerate(urls, 1):
                        logger.info(f"URL {i}: {url}")
                    logger.info("================")
                    
                    # Store query-URL mapping
                    for url in urls:
                        self.query_url_mapping[url] = query
                    return urls
                    
            except Exception as e:
                logger.error(f"Search attempt {attempt + 1}/{self.max_retries} failed: {str(e)}")
                if attempt < self.max_retries - 1:
                    sleep_time = self.request_delay * (attempt + 1)
                    logger.info(f"Retrying in {sleep_time} seconds...")
                    time.sleep(sleep_time)
                    
        logger.error(f"All search attempts failed for query: {query}")
        return []