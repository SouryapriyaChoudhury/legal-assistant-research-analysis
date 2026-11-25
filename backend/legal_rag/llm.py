import os
import re
import time

from langchain_groq import ChatGroq

# Free Groq keys allow about 8,000 tokens per minute for this model.
# A smaller completion budget keeps one research pass inside that cap.
def get_llm(max_tokens: int = 700) -> ChatGroq:
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY environment variable not set.")
    return ChatGroq(
        model="openai/gpt-oss-20b",
        temperature=0.2,
        groq_api_key=groq_api_key,
        reasoning_effort="low",
        reasoning_format="hidden",
        max_tokens=max_tokens,
        max_retries=0,
    )


def invoke_with_retry(runnable, variables, attempts: int = 6):
    """Call a Groq chain, waiting out token-per-minute limits."""
    last_error = None
    for attempt in range(attempts):
        try:
            return runnable.invoke(variables)
        except Exception as exc:
            message = str(exc)
            if "429" not in message and "rate_limit" not in message:
                raise
            last_error = exc
            match = re.search(r"try again in ([0-9.]+)s", message)
            wait = float(match.group(1)) + 0.75 if match else min(8 * (attempt + 1), 25)
            print(f"Groq rate limit. Waiting {wait:.1f}s ({attempt + 1}/{attempts})")
            time.sleep(wait)
    raise last_error


def invoke_text(llm, prompt, variables) -> str:
    result = invoke_with_retry(prompt | llm, variables)
    return getattr(result, "content", str(result))
