from ..state import LawyerAgentState


def finalizer(state: LawyerAgentState) -> dict:
    """Set the final analysis from the draft and attach the confidence score."""
    print("---FINALIZING ANALYSIS---")
    draft = state.get("answer_draft") or "Sorry, no analysis could be generated."
    score = state.get("answer_score")
    if isinstance(score, (int, float)):
        confidence = round(max(0.0, min(1.0, float(score))) * 5, 2)
        draft = (
            f"{draft}\n\n"
            "--- Evaluation Summary ---\n"
            f"Overall Confidence Score: {confidence} / 5\n"
            "This score blends the critic's legal review (60%) with semantic similarity to the query (40%)."
        )
    return {"final_analysis": draft}
