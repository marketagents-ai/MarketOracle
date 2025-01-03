import importlib
import os
from insert_agent_data import SimulationDataInserter
from web_search_manager import SearchManager, WebSearchConfig
from url_processor import URLFetcher, FetchedResult
from utils import (
    clean_response_content,
    load_config,
    logger,
    structure_text_response,
)
from market_agents.inference.parallel_inference import ParallelAIUtilities, RequestLimits
from market_agents.inference.message_models import LLMOutput, LLMPromptContext, LLMConfig, StructuredTool
from datetime import datetime
import json
from pydantic import BaseModel
from pathlib import Path
import uuid
from typing import Any, Dict, List, Optional, Type
import asyncio


class WebSearchResult(BaseModel):
    url: str
    title: str
    content: str
    timestamp: datetime
    status: str
    summary: Optional[dict] = {}
    agent_id: str
    extraction_method: str = "unknown"


class WebSearchAgent:
    def __init__(self, config, prompts: Dict):
        self.config = config
        self.prompts = prompts
        self.results: List[WebSearchResult] = []
        
        oai_request_limits = RequestLimits(
            max_requests_per_minute=500,
            max_tokens_per_minute=150000
        )
        self.ai_utils = ParallelAIUtilities(
            oai_request_limits=oai_request_limits,
            anthropic_request_limits=None
        )
        self.llm_configs = config.llm_configs
        self.search_manager = SearchManager(self.ai_utils, config, prompts)
        
        # Instantiate URLFetcher for URL fetching only
        self.url_fetcher = URLFetcher(config, prompts)

    async def process_search_query(self, query: str) -> None:
        """Process a search query by generating multiple queries and fetching URLs."""
        try:
            search_queries = await self.search_manager.generate_search_queries(query)
            
            logger.info(f"""
                            === Search Process Starting ===
                            Original Query: {query}
                            Generated {len(search_queries)} queries:
                            {chr(10).join(f'  {i+1}. {q}' for i, q in enumerate(search_queries))}
                            ==============================
                            """)

            all_results = []
            
            for idx, search_query in enumerate(search_queries, 1):
                logger.info(f"""
                                === Processing Query {idx}/{len(search_queries)} ===
                                Query: {search_query}
                                """)
                
                urls = self.search_manager.get_urls_for_query(
                    search_query, 
                    num_results=self.config.urls_per_query
                )
                
                logger.info(f"""
                                URLs found for query "{search_query}":
                                {chr(10).join(f'- {url}' for url in urls)}
                                """)

                for url in urls:
                    self.search_manager.query_url_mapping[url] = search_query
                
                # Fetch raw content without summary
                fetched_results = await self.url_fetcher.process_urls(urls, self.search_manager.query_url_mapping)

                # For each fetched result, generate summary and create WebSearchResult
                for fr in fetched_results:
                    # Generate summary if enabled
                    summary = {}
                    if self.config.use_ai_summary:
                        summary = await self.generate_ai_summary(fr.url, fr.content, 
                                                                 "Contains tables/charts" if fr.has_data else "Text only")

                    web_result = WebSearchResult(
                        url=fr.url,
                        title=fr.title,
                        content=fr.content.get('text', '')[:self.config.content_max_length],
                        timestamp=datetime.now(),
                        status="success" if fr.content else "failed",
                        summary=summary,
                        agent_id=str(uuid.uuid4()),
                        extraction_method=fr.extraction_method
                    )
                    all_results.append(web_result)
                
                logger.info(f"""
                            Query {idx} Results Summary:
                            - URLs processed: {len(urls)}
                            - Successful extractions: {len(fetched_results)}
                            - Failed extractions: {len(urls) - len(fetched_results)}
                            """)

            self.results = all_results
            
            logger.info(f"""
                    === Final Search Summary ===
                    Total Queries Processed: {len(search_queries)}
                    Total URLs Processed: {sum(len(self.search_manager.get_urls_for_query(q)) for q in search_queries)}
                    Total Successful Extractions: {len(self.results)}
                    """)

        except Exception as e:
            logger.error(f"Error processing search query: {str(e)}")
            raise

    def get_schema_class(self, schema_name: str) -> Type[BaseModel]:
        """Dynamically import and return the specified schema class from research_schemas."""
        try:
            schemas_module = importlib.import_module('market_agents.research_agents.research_schemas')
            schema_class = getattr(schemas_module, schema_name)
            return schema_class
        except (ImportError, AttributeError) as e:
            logger.error(f"Error loading schema {schema_name}: {str(e)}")
            raise

    async def generate_ai_summary(self, url: str, content: Dict[str, Any], content_type: str) -> Dict[str, Any]:
        """Generate AI summary using schema specified in config."""
        try:
            llm_config_dict = self.config.llm_configs["content_analysis"].copy()
            schema_config = llm_config_dict.pop('schema_config', {})
            system_prompt = llm_config_dict.pop('system_prompt', None)
            prompt_template = llm_config_dict.pop('prompt_template', None)
            llm_config = LLMConfig(**llm_config_dict)

            # Dynamically get the schema class
            schema_class = self.get_schema_class(schema_config['schema_name'])

            content_text = content.get('text', '')[:self.config.content_max_length]

            formatted_prompt = f"""
            Analyze this market content and provide comprehensive insights:

            URL: {url}
            CONTENT TYPE: {content_type}
            
            CONTENT:
            {content_text}

            Requirements:
            1. Identify the primary type of analysis needed (asset, sector, macro, or general)
            2. For assets: provide specific price targets, ratings, and actionable recommendations
            3. For sectors: analyze industry trends, top performers, and exposure recommendations
            4. For macro: focus on key indicators and their market implications
            5. Include quantitative metrics and specific data points where available
            6. Cite sources and provide evidence for recommendations
            7. Return a json object adhering to the provided schema
            """

            structured_tool = StructuredTool(
                json_schema=schema_class.model_json_schema(),
                schema_name=schema_config['schema_name'],
                schema_description=schema_config['schema_description'],
                instruction_string=schema_config['instruction_string']
            )

            context = LLMPromptContext(
                id=str(uuid.uuid4()),
                system_string=(
                    "You are an expert financial analyst specializing in cryptocurrency markets. "
                    "Provide detailed, quantitative analysis with specific price targets, "
                    "market implications, and actionable recommendations. Focus on evidence-based "
                    "insights and clear investment strategies."
                ),
                new_message=formatted_prompt,
                llm_config=llm_config.dict(),
                structured_output=structured_tool,
                use_schema_instruction=True,
                use_history=False
            )

            max_retries = 3
            for attempt in range(max_retries):
                try:
                    responses = await self.ai_utils.run_parallel_ai_completion([context])
                    
                    if responses and len(responses) > 0:
                        response = responses[0]
                        
                        if response.json_object and hasattr(response.json_object, 'object'):
                            try:
                                result = schema_class(**response.json_object.object)
                                return json.loads(result.model_dump_json(exclude_none=True))
                            except Exception as e:
                                logger.error(f"Error validating response: {str(e)}")
                                continue

                except Exception as e:
                    logger.error(f"Attempt {attempt + 1} failed: {str(e)}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(1 * (attempt + 1))
                        continue

            # Return empty schema structure if all attempts fail
            return json.loads(schema_class().model_dump_json())

        except Exception as e:
            logger.error(f"Error in summary generation: {str(e)}")
            schema_class = self.get_schema_class(self.config.llm_configs["content_analysis"]["schema_config"]["schema_name"])
            return json.loads(schema_class().model_dump_json())

    def save_results(self, output_file: str):
        """Save results to file and attempt database insertion"""
        results_dict = []
        
        logger.info("\n=== ARTICLE SUMMARIES ===")
        
        for result in self.results:
            if result is None:
                continue
                
            try:
                result_data = result.model_dump(exclude_none=True)
                results_dict.append(result_data)

                # Simply print the entire summary
                logger.info(f"""
                    === ARTICLE DETAILS ===
                    URL: {result.url}
                    TITLE: {result.title}
                    EXTRACTION METHOD: {result.extraction_method}

                    SUMMARY:
                    {json.dumps(result.summary, indent=2)}
                    =============================
                    """)
            except Exception as e:
                logger.error(f"Error processing result: {str(e)}")
                continue
            
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results_dict, f, indent=2, ensure_ascii=False, default=str)
        
        # Try to save to database (if applicable)
        try:
            db_params = {
                'dbname': os.getenv('DB_NAME', 'market_simulation'),
                'user': os.getenv('DB_USER', 'db_user'),
                'password': os.getenv('DB_PASSWORD', 'db_pwd@123'),
                'host': os.getenv('DB_HOST', 'localhost'),
                'port': os.getenv('DB_PORT', '5432')
            }
            
            inserter = SimulationDataInserter(db_params)
            
            if inserter.test_connection():
                logger.info("Database connection successful")
                inserter.insert_article_summaries(results_dict)
                logger.info(f"Successfully inserted {len(results_dict)} article summaries into database")
            else:
                raise Exception("Database connection test failed")
                
        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            logger.info(f"Results saved to file: {output_file}")


async def main():
    config_data, prompts = load_config()
    config = WebSearchConfig(**config_data)
    agent = WebSearchAgent(config, prompts)
    logger.info(f"Starting search with query: {config.query}")
    await agent.process_search_query(config.query)
    
    output_file = f"outputs/web_search/results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    agent.save_results(output_file)
    
    successful = sum(1 for r in agent.results if r and r.status == "success")
    failed = len(agent.results) - successful if agent.results else 0
    
    logger.info(f"""
                    Search completed:
                    - Query: {config.query}
                    - Total items processed: {len(agent.results) if agent.results else 0}
                    - Successful: {successful}
                    - Failed: {failed}
                    - Results saved to: {output_file}
                            """)

if __name__ == "__main__":
    asyncio.run(main())
