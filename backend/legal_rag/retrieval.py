# LARA/legal_rag/retrieval.py

import os
from pathlib import Path
from typing import TypedDict, Annotated, List, Any
import operator

from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_core.documents import Document
from langchain_core.messages import BaseMessage
from langchain_core.runnables import RunnableParallel
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_tavily import TavilySearch

# -------------------------
# Load environment variables
# -------------------------
backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(backend_dir / ".env")

# -------------------------
# GLOBAL LAZY-LOADED OBJECTS
# -------------------------
_embedding_model = None
_faiss_db = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        # Must match the model that built backend/data/faiss_index.
        _embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return _embedding_model


def get_faiss_db():
    global _faiss_db
    if _faiss_db is None:
        faiss_index_path = backend_dir / "data" / "faiss_index"
        _faiss_db = FAISS.load_local(
            str(faiss_index_path),
            get_embedding_model(),
            allow_dangerous_deserialization=True,
        )
    return _faiss_db


def format_search_results(results) -> str:
    """Normalize Tavily payloads (string, dict, or list) into plain text."""
    if results is None:
        return ""
    if isinstance(results, str):
        return results.strip()
    if isinstance(results, dict):
        nested = results.get("results")
        results = nested if isinstance(nested, list) else [results]
    if not isinstance(results, list):
        return str(results)

    parts = []
    for item in results:
        if isinstance(item, str):
            text = item.strip()
        elif isinstance(item, dict):
            title = item.get("title") or ""
            body = item.get("content") or item.get("snippet") or item.get("raw_content") or ""
            url = item.get("url") or ""
            text = "\n".join(piece for piece in (title, body, url) if piece)
        else:
            text = str(item).strip()
        if text:
            parts.append(text)
    return "\n\n".join(parts)


# -------------------------
# Agent State
# -------------------------
class AgentState(TypedDict):
    query: str
    intermediate_steps: Annotated[List[Any], operator.add]
    web_search_results: str
    faiss_search_results: str
    final_analysis: str
    research_complete: bool
    chat_history: List[BaseMessage]
    sources: Annotated[List[dict], operator.add]


# -------------------------
# FAISS Legal DB Tool (LAZY SAFE)
# -------------------------
@tool
def legal_database_search(query: str) -> List[Document]:
    """
    Search against a pre-indexed FAISS vector store of Indian laws and cases.
    Returns a list of Document objects.
    """
    global faiss_db
    try:
        db = get_faiss_db()
        retrieved_docs = db.similarity_search_with_score(query, k=5)
        return [doc[0] for doc in retrieved_docs]

    except FileNotFoundError:
        return [Document(page_content="FAISS index not found.")]
    except Exception as e:
        return [Document(page_content=f"Error during legal database search: {e}")]


# -------------------------
# Research Function
# -------------------------
def perform_research(state: AgentState) -> dict:
    print("---PERFORMING RESEARCH---")
    query = state["query"]

    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        raise ValueError("TAVILY_API_KEY environment variable not set.")

    web_search_tool = TavilySearch(max_results=5, tavily_api_key=tavily_api_key)

    rag_chain = RunnableParallel(
        {
            "faiss_search_results": lambda x: legal_database_search.invoke(x["query"]),
            "web_search_results": lambda x: web_search_tool.invoke(x["query"]),
        }
    )

    results = rag_chain.invoke({"query": query})

    faiss_docs = results.get("faiss_search_results", [])
    web_results = results.get("web_search_results", [])

    sources = []
    faiss_content = ""

    for doc in faiss_docs:
        faiss_content += doc.page_content + "\n\n"
        if doc.metadata:
            sources.append({"type": "document", "metadata": doc.metadata})

    web_content = format_search_results(web_results)
    if web_content:
        sources.append({"type": "web", "content": web_content[:1000]})

    print("---RESEARCH COMPLETE---")

    return {
        "faiss_search_results": faiss_content,
        "web_search_results": web_content,
        "sources": sources,
        "intermediate_steps": [
            f"FAISS Results: {faiss_content}",
            f"Web Results: {web_content}",
        ],
    }
