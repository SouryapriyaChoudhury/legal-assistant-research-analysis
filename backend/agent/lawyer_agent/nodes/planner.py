import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
import json

from ..state import LawyerAgentState

load_dotenv()


def get_llm():
    from legal_rag.llm import get_llm as build_llm

    return build_llm(max_tokens=400)


def _strip_json_fence(text: str) -> str:
    cleaned = text.strip().replace("```json", "").replace("```JSON", "").replace("```", "").strip()
    list_start = cleaned.find("[")
    list_end = cleaned.rfind("]")
    if list_start != -1 and list_end > list_start:
        return cleaned[list_start:list_end + 1]
    return cleaned


def safe_invoke(llm, prompt, vars):
    from legal_rag.llm import invoke_text

    return invoke_text(llm, prompt, vars)


def planner(state: LawyerAgentState) -> dict:
    """Convert issues and facts into 3-6 retrieval sub-queries."""
    print("---PLANNING RETRIEVAL SUB-QUERIES---")
    issues = state["issues"]
    facts = state["facts"]
    query = state["query"]

    issues_str = "\n".join(issues)
    facts_str = "\n".join(facts)

    llm = get_llm()
    prompt = PromptTemplate(
        template="""You are a legal research planner. Based on the legal issues and facts, generate 3-6 specific sub-queries for retrieving relevant legal information from databases and web searches.

Issues:
{issues}

Facts:
{facts}

Original Query: {query}

Generate sub-queries that focus on:
- Relevant statutes and sections
- Case precedents
- Legal principles
- Recent judgments

Provide output as JSON list: ["sub_query1", "sub_query2", ...]

Sub-queries:""",
        input_variables=["issues", "facts", "query"],
    )

    response = safe_invoke(
        llm, prompt, {"issues": issues_str, "facts": facts_str, "query": query}
    )

    try:
        sub_queries = json.loads(_strip_json_fence(response))
        if not isinstance(sub_queries, list):
            sub_queries = [response]
    except json.JSONDecodeError:
        # Fallback: split by lines
        sub_queries = [line.strip() for line in response.split("\n") if line.strip()][
            :6
        ]

    return {"sub_queries": sub_queries}
