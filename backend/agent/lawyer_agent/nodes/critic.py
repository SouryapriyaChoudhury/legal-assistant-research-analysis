import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
import json
from sentence_transformers import SentenceTransformer, util

from ..state import LawyerAgentState

load_dotenv()

EMBEDDING_MODEL = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def get_llm():
    from legal_rag.llm import get_llm as build_llm

    return build_llm(max_tokens=200)


def safe_invoke(llm, prompt, vars):
    from legal_rag.llm import invoke_text

    return invoke_text(llm, prompt, vars)


def critic(state: LawyerAgentState) -> dict:
    """Evaluate the draft answer and assign a score 0.0-1.0."""
    print("---CRITIC EVALUATION---")
    query = state["query"]
    answer_draft = state["answer_draft"]
    retrieved_context = "\n".join(state["retrieved_context"])

    llm = get_llm()
    eval_prompt = PromptTemplate(
        template="""Evaluate the legal answer draft on a scale of 0.0 to 1.0.

Query: {query}
Retrieved Context: {context}
Answer Draft: {answer}

Score based on:
- Relevance to query
- Use of retrieved context
- Legal accuracy
- Completeness

Output only a number between 0.0 and 1.0:""",
        input_variables=["query", "context", "answer"],
    )

    llm_score_str = safe_invoke(
        llm,
        eval_prompt,
        {"query": query, "context": retrieved_context[:2000], "answer": answer_draft},
    )
    try:
        llm_score = float(llm_score_str.strip())
        llm_score = max(0.0, min(1.0, llm_score))
    except ValueError:
        llm_score = 0.5

    # Semantic similarity
    if EMBEDDING_MODEL:
        emb_query = EMBEDDING_MODEL.encode(query, convert_to_tensor=True)
        emb_answer = EMBEDDING_MODEL.encode(answer_draft, convert_to_tensor=True)
        raw_sim = util.cos_sim(emb_answer, emb_query).item()
        sim_score = max(0.0, min(1.0, (raw_sim - 0.20) / 0.55))
    else:
        sim_score = 0.5

    # 60% legal review, 40% calibrated semantic similarity.
    final_score = (0.6 * llm_score) + (0.4 * sim_score)

    return {"answer_score": final_score, "iterations": 1}
