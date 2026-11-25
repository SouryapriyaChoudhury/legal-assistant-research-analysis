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
    object_start = cleaned.find("{")
    object_end = cleaned.rfind("}")
    if object_start != -1 and object_end > object_start:
        return cleaned[object_start:object_end + 1]
    return cleaned


def safe_invoke(llm, prompt, vars):
    from legal_rag.llm import invoke_text

    return invoke_text(llm, prompt, vars)


def issue_extractor(state: LawyerAgentState) -> dict:
    """Extract structured legal issues and facts from the user query."""
    print("---EXTRACTING ISSUES AND FACTS---")
    query = state["query"]

    llm = get_llm()
    prompt = PromptTemplate(
        template="""You are a legal assistant. Analyze the following legal query and extract:

1. **Legal Issues**: List the key legal issues or questions raised.
2. **Facts**: List the relevant facts mentioned in the query.

Provide the output in JSON format:
{{
    "issues": ["issue1", "issue2", ...],
    "facts": ["fact1", "fact2", ...]
}}

Query: {query}

Output:""",
        input_variables=["query"],
    )

    response = safe_invoke(llm, prompt, {"query": query})

    try:
        data = json.loads(_strip_json_fence(response))
        issues = data.get("issues", [])
        facts = data.get("facts", [])
    except json.JSONDecodeError:
        # Fallback: simple extraction
        issues = [query.split(".")[0]] if "." in query else [query]
        facts = []

    return {"issues": issues, "facts": facts}
