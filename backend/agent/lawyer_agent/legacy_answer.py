import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

load_dotenv()


def get_llm():
    """Initialize Groq LLM with env key."""
    from legal_rag.llm import get_llm as build_llm

    return build_llm()


def safe_invoke(llm, prompt, vars):
    """Run a prompt safely and return text content."""
    from legal_rag.llm import invoke_text

    return invoke_text(llm, prompt, vars)


def summarize_long_text(text: str, label: str, query: str) -> str:
    """Summarize text with fast strategy."""
    if not text:
        return f"No {label} found."

    llm = get_llm()

    # Fast mode: just trim input
    trimmed = " ".join(text.split()[:700])
    prompt = PromptTemplate(
        template="""Summarize the following {label} (<200 words), focusing on acts, sections, judgments.

        Query: {query}
        Text: {text}

        Summary:""",
        input_variables=["query", "text", "label"],
    )
    return safe_invoke(llm, prompt, {"query": query, "text": trimmed, "label": label})


def generate_legacy_lawyer_answer(query: str, all_steps: str) -> str:
    """Generates a structured legal analysis report for a lawyer (legacy logic)."""
    print("---GENERATING LEGACY LAWYER ANALYSIS REPORT---")

    # Compress steps if too long
    if len(all_steps.split()) > 1500:
        all_steps = summarize_long_text(all_steps, "research steps", query)

    llm = get_llm()
    analysis_prompt = PromptTemplate(
        template="""You are an expert legal assistant. Based on the lawyer's case details
        and the research steps below, generate a professional legal analysis.

        - **Original Case Details**: A summary of the query provided by the lawyer.
        - **Relevant Statutes & Acts**: List of key legal provisions from Indian Law.
        - **Past Case Precedents & Judgments**: A detailed summary of related case studies with names and citations.
        - **Key Legal Arguments & Points**: Actionable points and arguments derived from the research.
        - **Sources**: A clear list of all web pages and internal documents used.

        Case Details: {query}
        Research Steps: {all_steps}

        Final Legal Analysis:""",
        input_variables=["query", "all_steps"],
    )

    final_analysis = safe_invoke(
        llm, analysis_prompt, {"query": query, "all_steps": all_steps}
    )

    return final_analysis
