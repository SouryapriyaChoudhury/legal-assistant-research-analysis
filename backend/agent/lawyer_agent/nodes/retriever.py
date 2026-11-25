import os
from langchain_tavily import TavilySearch

from legal_rag.retrieval import format_search_results, get_faiss_db
from ..state import LawyerAgentState


def legal_database_search(query: str) -> str:
    """Search the shared FAISS index and return a content string."""
    try:
        db = get_faiss_db()
        retrieved_docs = db.similarity_search_with_score(query, k=5)
        return "\n\n".join(doc.page_content for doc, _score in retrieved_docs)
    except Exception as e:
        return f"Error during legal database search: {e}"


def web_search(query: str) -> str:
    """Perform web search using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        raise ValueError("TAVILY_API_KEY environment variable not set.")

    web_search_tool = TavilySearch(max_results=5, tavily_api_key=tavily_api_key)
    results = web_search_tool.invoke(query)
    return format_search_results(results)


def retriever(state: LawyerAgentState) -> dict:
    """Retrieve context for each sub-query and merge into retrieved_context."""
    print("---RETRIEVING CONTEXT---")
    sub_queries = state["sub_queries"]

    retrieved_context = []
    for sub_query in sub_queries:
        print(f"Retrieving for: {sub_query}")
        faiss_result = legal_database_search(sub_query)
        web_result = web_search(sub_query)
        combined = f"Sub-query: {sub_query}\nFAISS: {faiss_result}\nWeb: {web_result}\n"
        retrieved_context.append(combined)

    return {"retrieved_context": retrieved_context}
