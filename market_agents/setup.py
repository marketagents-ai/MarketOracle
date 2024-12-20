from setuptools import setup, find_packages

setup(
    name="market_agents",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "pydantic==2.8.2",
        "pandas==2.2.2",
        "matplotlib==3.9.2",
        "dash==2.17.1",
        "anthropic==0.34.1",
        "openai==1.42.0",
        "python-dotenv==1.0.1",
        "pydantic-settings==2.5.2",
        "colorama==0.4.6",
        "names==0.3.0",
        "tiktoken==0.7.0",
        "aiohttp",
        "scipy",
        "fastapi",
        "uvicorn",
        "psycopg2-binary"
    ],
)