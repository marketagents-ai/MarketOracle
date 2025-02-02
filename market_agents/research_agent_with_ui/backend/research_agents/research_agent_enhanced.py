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
import logging


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
    def __init__(
        self,
        config: WebSearchConfig,
        prompts: Dict[str, str],
        custom_schemas: Optional[List[Dict[str, Any]]] = None
    ):
        # Remove the super().__init__() call since this class doesn't inherit from any parent
        self.logger = logging.getLogger(__name__)
        
        # Initialize instance variables
        self.config = config
        self.prompts = prompts
        self.custom_schemas = custom_schemas or []
        self.results: List[WebSearchResult] = []
        
        # Log custom schemas configuration
        if self.custom_schemas:
            self.logger.info(f"Initialized with custom schemas: {[schema['name'] for schema in self.custom_schemas]}")
        else:
            self.logger.warning("No custom schemas configured")
        
        # Initialize other components
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
    async def generate_market_analysis(self, content: str) -> Dict[str, Any]:
        # Combine default and custom fields for analysis
        analysis_fields = {
            "TICKER": "Asset/token symbol",
            "RATING": "Investment rating",
            "TARGET_PRICE": "Price predictions",
            "SENTIMENT": "Market sentiment",
            "ACTION": "Recommended trading action",
            "CATALYSTS": "Key market drivers",
            "KPIS": "Key performance indicators",
            "SOURCES": "Data sources"
        }
        
        # Add custom fields to analysis
        for schema in self.custom_schemas:
            field_name = schema["name"].upper()
            analysis_fields[field_name] = schema["description"]
        
        # Update prompt to include custom fields
        analysis_prompt = self.create_analysis_prompt(content, analysis_fields)
        
        # Generate analysis including custom fields
        analysis_result = await self.generate_ai_analysis(analysis_prompt)
        
        return analysis_result
    def create_analysis_prompt(self, content: str, analysis_fields: Dict[str, str]) -> str:
        # Create prompt that includes all fields
        fields_description = "\n".join(
            f"- {field}: {description}"
            for field, description in analysis_fields.items()
        )
        
        return f"""
        Analyze the following content and provide a structured market analysis.
        Include analysis for each of these fields:
        
        {fields_description}
        
        Content to analyze:
        {content}
        """

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
                        # Generate standard summary
                        summary = await self.generate_ai_summary(fr.url, fr.content, 
                                                            "Contains tables/charts" if fr.has_data else "Text only")
                        
                        # Generate custom field summaries if custom schemas exist
                        if self.custom_schemas and 'assets' in summary and summary['assets']:
                            for asset in summary['assets']:
                                custom_fields = {}
                                for schema in self.custom_schemas:
                                    field_name = schema['name'].lower()
                                    # Generate specific analysis for custom field
                                    custom_analysis = await self._generate_custom_field_analysis(
                                        fr.content.get('text', ''),
                                        schema['name'],
                                        schema.get('description', '')
                                    )
                                    custom_fields[field_name] = custom_analysis
                                
                                # Add custom fields to asset
                                asset['custom_fields'] = custom_fields

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
                    Custom Fields Analyzed: {[schema['name'] for schema in self.custom_schemas] if self.custom_schemas else 'None'}
                    """)

        except Exception as e:
            logger.error(f"Error processing search query: {str(e)}")
            raise

    async def _generate_custom_field_analysis(self, content: str, field_name: str, description: str) -> str:
        """Generate specific analysis for a custom field"""
        prompt = f"""
        Based on the following market content, provide a detailed analysis for {field_name}.
        
        Field Description: {description}
        
        Content to analyze:
        {content}
        
        Requirements:
        1. Provide specific numerical predictions or values where applicable
        2. Include market-based justification for your analysis
        3. Reference specific data points from the content
        4. Consider both short-term and long-term implications
        5. Ensure analysis is actionable and concrete
        6. Base all analysis solely on the provided content
        7. Format the response in a clear, structured manner
        """

        try:
            context = LLMPromptContext(
                id=str(uuid.uuid4()),
                system_string="You are an expert financial analyst specializing in cryptocurrency markets.",
                new_message=prompt,
                llm_config=self.llm_configs["content_analysis"].dict(),
                use_history=False
            )
            
            responses = await self.ai_utils.run_parallel_ai_completion([context])
            if responses and len(responses) > 0:
                return responses[0].content.strip()
            return ""
        except Exception as e:
            logger.error(f"Error generating custom field analysis: {str(e)}")
            return ""
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
        """Generate AI summary using schema specified in config with enhanced custom field support."""
        try:
            # Get base LLM config
            llm_config_dict = self.config.llm_configs["content_analysis"].copy()
            schema_config = llm_config_dict.pop('schema_config', {})
            system_prompt = llm_config_dict.pop('system_prompt', None)
            prompt_template = llm_config_dict.pop('prompt_template', None)
            llm_config = LLMConfig(**llm_config_dict)

            # Dynamically get the schema class
            schema_class = self.get_schema_class(schema_config['schema_name'])
            
            content_text = content.get('text', '')[:self.config.content_max_length]

            # Enhanced custom fields prompt generation
            custom_fields_prompt = ""
            if self.custom_schemas:
                for schema in self.custom_schemas:
                    field_name = schema['name'].upper()
                    custom_fields_prompt += f"\n{field_name} ANALYSIS:\n"
                    custom_fields_prompt += f"- Description: {schema.get('description', '')}\n"
                    custom_fields_prompt += "- Requirements:\n"
                    custom_fields_prompt += "  * Provide numerical predictions with confidence levels\n"
                    custom_fields_prompt += "  * Include market-based justification\n"
                    custom_fields_prompt += "  * Consider both short and long-term implications\n"

            # Enhanced prompt with custom fields support
            formatted_prompt = f"""
            Analyze this market content and provide detailed insights including custom metrics:

            URL: {url}
            CONTENT TYPE: {content_type}
            
            CONTENT:
            {content_text}

            {custom_fields_prompt}

            Requirements:
            1. Identify key market drivers and trends
            2. Provide specific price targets and confidence levels
            3. Include quantitative metrics where available
            4. Analyze custom fields with detailed predictions
            5. Base all analysis on provided content
            6. Return structured JSON response
            """

            structured_tool = StructuredTool(
                json_schema=schema_class.model_json_schema(),
                schema_name=schema_config['schema_name'],
                schema_description=schema_config['schema_description'],
                instruction_string=schema_config['instruction_string']
            )

            context = LLMPromptContext(
                id=str(uuid.uuid4()),
                system_string=system_prompt,
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
                                analysis_result = json.loads(result.model_dump_json(exclude_none=True))
                                
                                if self.custom_schemas and 'assets' in analysis_result and analysis_result['assets']:
                                    for asset in analysis_result['assets']:
                                        custom_fields = {}
                                        for schema in self.custom_schemas:
                                            field_name = schema['name'].lower()
                                            logger.info(f"Generating custom analysis for field: {field_name}")
                                            
                                            # Generate custom analysis with retry logic
                                            max_field_retries = 2
                                            for field_attempt in range(max_field_retries):
                                                try:
                                                    custom_analysis = await self._generate_custom_field_analysis(
                                                        content_text,
                                                        field_name,
                                                        schema.get('description', '')
                                                    )
                                                    
                                                    if custom_analysis and custom_analysis != f"No analysis available for {field_name}":
                                                        custom_fields[field_name] = custom_analysis
                                                        logger.info(f"Successfully generated analysis for {field_name}")
                                                        break
                                                except Exception as field_error:
                                                    logger.error(f"Attempt {field_attempt + 1} failed for {field_name}: {str(field_error)}")
                                                    if field_attempt < max_field_retries - 1:
                                                        await asyncio.sleep(1)
                                            
                                            if field_name not in custom_fields:
                                                custom_fields[field_name] = f"Analysis pending for {field_name}"
                                        
                                        asset['custom_fields'] = custom_fields
                                
                                return analysis_result

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

    async def _generate_custom_field_analysis(self, content: str, field_name: str, description: str) -> str:
        """Generate specific analysis for a custom field with enhanced market metrics"""
        prompt = f"""
        Based on the following market content, provide a detailed analysis for {field_name.upper()}.
        
        Field Description: {description}
        
        Content to analyze:
        {content}
        
        Required Analysis Format:
        1. Numerical Prediction:
        - Specific value or range
        - Confidence level (%)
        - Timeline (short/medium/long term)
        
        2. Market Justification:
        - Key market drivers
        - Supporting data points
        - Technical indicators
        
        3. Risk Assessment:
        - Potential challenges
        - Market conditions
        - Impact factors
        
        Format the response as a concise, structured analysis with specific numbers and predictions.
        """

        try:
            context = LLMPromptContext(
                id=str(uuid.uuid4()),
                system_string="You are an expert financial analyst specializing in cryptocurrency markets and quantitative analysis.",
                new_message=prompt,
                llm_config=self.llm_configs["content_analysis"].dict(),
                use_history=False
            )
            
            responses = await self.ai_utils.run_parallel_ai_completion([context])
            if responses and len(responses) > 0:
                return responses[0].content.strip()
            return f"No analysis available for {field_name}"
        except Exception as e:
            logger.error(f"Error generating custom field analysis: {str(e)}")
            return f"Analysis failed for {field_name}: {str(e)}"


    def _format_custom_fields_prompt(self) -> str:
        """Format custom fields for the prompt with detailed requirements"""
        if not self.custom_schemas:
            return ""
        
        custom_fields_prompt = []
        for schema in self.custom_schemas:
            field_name = schema['name'].upper()
            description = schema.get('description', '')
            requirements = schema.get('requirements', [])
            
            # Enhanced prompt structure for better AI analysis
            field_prompt = f"""
            {field_name}:
            - Provide detailed {field_name} analysis based on available market data
            - Include quantitative metrics and qualitative insights
            - Consider historical trends and current market conditions
            - Analyze impact on trading decisions
            - Base analysis on following factors:
                * Market data and trends
                * Technical indicators
                * News sentiment
                * Trading volumes
                * Market participant behavior
            - Description: {description}
            - Additional Requirements: {', '.join(requirements) if requirements else 'None'}
            """
            custom_fields_prompt.append(field_prompt)
        
        return "\n".join(custom_fields_prompt)

    def _parse_analysis_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and structure the analysis response including custom fields"""
        try:
            parsed = {
                'assets': [{
                    'ticker': '',
                    'rating': '',
                    'target_price': '',
                    'sentiment': '',
                    'action': '',
                    'catalysts': [],
                    'kpis': [],
                    'sources': [],
                }]
            }
            
            if 'assets' in response and response['assets']:
                asset = response['assets'][0]
                
                # Add custom fields to the asset
                if self.custom_schemas:
                    custom_fields = {}
                    for schema in self.custom_schemas:
                        field_name = schema['name'].lower()
                        if field_name in response:
                            custom_fields[field_name] = response[field_name]
                        elif field_name in asset:
                            custom_fields[field_name] = asset[field_name]
                    
                    if custom_fields:
                        asset['custom_fields'] = custom_fields
                        
                parsed['assets'][0] = asset

            return parsed

        except Exception as e:
            logger.error(f"Error parsing analysis response: {str(e)}")
            return {}
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
