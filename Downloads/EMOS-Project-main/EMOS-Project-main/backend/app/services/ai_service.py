import httpx
import os
import json
from pathlib import Path
from .prompts import EXTRACTION_PROMPT
from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(backend_dir / ".env")

def _get_api_key():
    key = os.getenv("FIREWORKS_API_KEY")
    if not key:
        key = os.getenv("FIREWORKS_API_KEY")
    if not key:
        load_dotenv(backend_dir / ".env", override=True)
        key = os.getenv("FIREWORKS_API_KEY")
    return key

def _get_model():
    return os.getenv("FIREWORKS_MODEL", "accounts/fireworks/models/glm-5p1")

async def extract_meeting_data(transcript_text: str):
    """
    Sends the meeting transcript to Fireworks AI and returns structured JSON data.
    """
    api_key = _get_api_key()
    model = _get_model()
    
    if not api_key:
        return {
            "error": "FIREWORKS_API_KEY not set in environment variables.",
            "summary": "AI service unavailable. Please set your API key.",
            "decisions": [],
            "action_items": [],
            "commitments": [],
            "risks": [],
            "dependencies": [],
            "questions": []
        }
    
    # Fill the prompt with the transcript
    prompt = EXTRACTION_PROMPT.format(transcript_text=transcript_text)
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 16000
    }
    
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                "https://api.fireworks.ai/inference/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            # Strip BOM and whitespace
            content = content.strip().lstrip("\ufeff")
            
            # Remove markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                lines = content.split("\n")
                code_lines = []
                in_block = False
                for line in lines:
                    if line.strip().startswith("```"):
                        in_block = not in_block
                        continue
                    if in_block:
                        code_lines.append(line)
                if code_lines:
                    content = "\n".join(code_lines)
            
            # Extract JSON object by finding first { and matching closing }
            content = content.strip()
            start = content.find("{")
            if start != -1:
                depth = 0
                end = -1
                for i in range(start, len(content)):
                    if content[i] == "{":
                        depth += 1
                    elif content[i] == "}":
                        depth -= 1
                        if depth == 0:
                            end = i + 1
                            break
                if end != -1:
                    content = content[start:end]
            
            # Parse JSON
            parsed = json.loads(content.strip())
            
            # Ensure all keys exist
            default = {
                "summary": "",
                "decisions": [],
                "action_items": [],
                "commitments": [],
                "risks": [],
                "dependencies": [],
                "questions": []
            }
            # Merge parsed data with defaults (so missing keys don't break the app)
            for key in default:
                if key not in parsed:
                    parsed[key] = default[key]
            
            return parsed
            
    except json.JSONDecodeError as e:
        return {
            "error": f"JSON parse error: {str(e)}",
            "summary": "AI returned invalid JSON. Please check the transcript format.",
            "decisions": [],
            "action_items": [],
            "commitments": [],
            "risks": [],
            "dependencies": [],
            "questions": []
        }
    except Exception as e:
        return {
            "error": f"API error: {str(e)}",
            "summary": "AI service temporarily unavailable.",
            "decisions": [],
            "action_items": [],
            "commitments": [],
            "risks": [],
            "dependencies": [],
            "questions": []
        }
