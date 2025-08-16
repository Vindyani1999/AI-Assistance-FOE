import json
import re
from src.deepseek_llm import DeepSeekLLM
from src.recurrence.recurrence_prompt import RECURRENCE_PROMPT

def extract_recurrence(user_input: str) -> dict:
    print(f"[Recurrence Parser] Received input: {user_input}")

    llm = DeepSeekLLM()
    prompt = RECURRENCE_PROMPT.format(user_input=user_input)
    print(f"[Recurrence Parser] Generated prompt for LLM:\n{prompt}")

    raw = llm._call(prompt)
    print(f"[Recurrence Parser] Raw LLM response:\n{raw}")

    cleaned = re.sub(r"^```json|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    print(f"[Recurrence Parser] Cleaned JSON string:\n{cleaned}")

    try:
        parsed = json.loads(cleaned)
        print(f"[Recurrence Parser] Parsed recurrence data: {parsed}")
    except json.JSONDecodeError:
        print("[Recurrence Parser] Failed to parse JSON, returning default non-recurring response")
        return {"is_recurring": False}

    return parsed
