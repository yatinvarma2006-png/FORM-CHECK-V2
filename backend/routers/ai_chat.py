"""AI Chat endpoint powered by Google Gemini with rich biomechanics context.

Provides a conversational biomechanics coach that has full context of the
user's analysis results (metrics, faults, cues, drills) and can answer
ANY question about deadlift or bowling form, technique, lat engagement, grip,
belt usage, sumo vs conventional, programming, mobility, injury prevention, etc.
"""

from __future__ import annotations

import os
from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

router = APIRouter(prefix="/api/ai", tags=["ai"])

# ── Schemas ────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" or "ai"
    text: str


class AIChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    sport: Optional[str] = None
    metrics_context: Optional[List[dict]] = None
    ai_report_context: Optional[dict] = None


class AIChatResponse(BaseModel):
    reply: str


# ── System Prompt Builder ──────────────────────────────────────────────────

def _build_system_prompt(
    sport: str | None,
    metrics: list[dict] | None,
    ai_report: dict | None,
) -> str:
    base = (
        "You are FormCheck AI Coach, an elite sports biomechanics specialist and powerlifting coach.\n"
        "Provide thorough, direct, highly actionable answers to any question about deadlift or bowling mechanics, "
        "lat engagement, setup cues, stance variations, grip, belt usage, programming, or injury prevention.\n"
        "Be punchy, clear, and complete every sentence without leaving trailing bullets or truncated text.\n"
        "Use bold headers and bullet points.\n"
    )

    if sport:
        base += f"\nCurrent Sport Context: {sport.upper()}\n"

    if metrics:
        base += "\n--- ATHLETE'S LIVE VIDEO METRICS ---\n"
        for m in metrics:
            status = "⚠️ FLAGGED" if m.get("flagged") else "✅ OK"
            base += (
                f"• {m.get('display_name', m.get('metric_name'))}: "
                f"{m.get('value')} {m.get('unit', '')} "
                f"(range: {m.get('min')}-{m.get('max')}) [{status}]\n"
            )

    if ai_report:
        base += f"\n--- AI COACHING SUMMARY ---\n"
        base += f"Form Efficiency Score: {ai_report.get('ai_score', '?')}/100\n"
        base += f"Risk Level: {ai_report.get('risk_level', '?')}\n"
        base += f"Overview: {ai_report.get('summary', '')}\n"

    return base


# ── Comprehensive Offline Knowledge Base ────────────────────────────────────

def _generate_fallback_response(req: AIChatRequest) -> str:
    """Rich conversational responses covering deadlift topics when API key is unavailable."""
    msg = req.message.lower().strip()

    if "lat" in msg or "shoulder blade" in msg or "upper back" in msg:
        return (
            "**How to Properly Engage Your Lats in the Deadlift:**\n\n"
            "1. **'Protect Your Armpits' Cue:** Imagine squeezing oranges in your armpits before the bar leaves the floor.\n"
            "2. **'Squeeze the Bar into Your Shins':** Actively pull the bar back toward your legs using your latissimus dorsi.\n"
            "3. **Depress Your Scapulae:** Pull your shoulder blades down into your back pockets.\n"
            "4. **Pull the Slack:** Wedging into the bar until you hear the metal click ensures full torso tension before leg drive."
        )

    elif "spine" in msg or "back" in msg or "pain" in msg or "round" in msg:
        return (
            "**Preventing Lower Back Rounding & Pain in Deadlifts:**\n\n"
            "1. **Spinal Neutrality:** Maintain a straight line from crown of head through thoracic and lumbar spine.\n"
            "2. **Bracing:** Take a deep 360-degree intra-abdominal breath into your belt/core before pulling.\n"
            "3. **Leg Drive First:** Drive the floor away using quads so hips and chest rise together."
        )

    elif "sumo" in msg or "stance" in msg or "width" in msg:
        return (
            "**Sumo vs. Conventional Deadlift Mechanics:**\n\n"
            "* **Conventional:** Narrow stance, wider hip hinge angle, greater lower back erector demand.\n"
            "* **Sumo:** Wide stance, toe flare, shorter vertical torso moment arm, higher quad/adductor engagement."
        )

    return (
        f"**AI Biomechanics Guidance for '{req.message}':**\n\n"
        "In deadlifting, optimum force production requires:\n"
        "1. **Mid-Foot Bar Path:** Keeping the barbell centered directly over the mid-foot.\n"
        "2. **Simultaneous Extension:** Knees and hips locking out together at the top of the pull.\n"
        "3. **Posterior Chain Drive:** Squeezing glutes hard into the bar to finish terminal lockout without hyper-extending."
    )


# ── Endpoint Handler ────────────────────────────────────────────────────────

@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(req: AIChatRequest):
    """Send a message to the AI Biomechanics Coach (powered by Gemini Flash)."""
    api_key = os.environ.get("GEMINI_API_KEY", "")

    if not api_key:
        reply_text = _generate_fallback_response(req)
        return AIChatResponse(reply=reply_text)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        system_prompt = _build_system_prompt(
            sport=req.sport,
            metrics=req.metrics_context,
            ai_report=req.ai_report_context,
        )

        contents = []
        for msg in req.history:
            if msg.text.strip() == req.message.strip() and msg.role == "user":
                continue
            role = "user" if msg.role == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.text}]})

        contents.append({"role": "user", "parts": [{"text": req.message}]})

        # Try Gemini Flash models with generous output token limit (4096 tokens)
        candidate_models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]
        response = None

        for m_name in candidate_models:
            try:
                response = client.models.generate_content(
                    model=m_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.7,
                        max_output_tokens=4096,
                    ),
                )
                if response:
                    break
            except Exception:
                continue

        reply_text = ""
        if response and hasattr(response, "candidates") and response.candidates:
            if response.candidates[0].content:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "text") and part.text:
                        if getattr(part, "thought", False):
                            continue
                        reply_text += part.text

        if not reply_text and response and hasattr(response, "text"):
            reply_text = response.text or ""

        if not reply_text.strip():
            reply_text = _generate_fallback_response(req)

        return AIChatResponse(reply=reply_text.strip())

    except Exception as e:
        reply_text = _generate_fallback_response(req)
        return AIChatResponse(reply=reply_text)
