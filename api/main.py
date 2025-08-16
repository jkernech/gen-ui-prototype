from __future__ import annotations

import asyncio
import json
import os
import uuid
from typing import Any, AsyncIterable, Dict, List, Optional

from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

# Load .env so OPENAI_API_KEY, OPENAI_MODEL, FRONTEND_ORIGIN are present
load_dotenv()

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="FastAPI + LangChain • UI Message Data Stream")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Tools matching your Next.js route ----------

@tool
def showStockInformation(symbol: str, numOfMonths: int) -> list[dict[str, Any]]:
    """
    Get stock information for a symbol for the last numOfMonths months.
    Returns a list of { date: YYYY-MM-DD, value: int } objects.
    """
    from datetime import date

    out: list[dict[str, Any]] = []
    today = date.today()
    for i in range(numOfMonths):
        month_index = numOfMonths - 1 - i
        y = today.year
        m = today.month - month_index
        while m <= 0:
            y -= 1
            m += 12
        d = date(y, m, min(today.day, 28))
        base_value = 100 + i * 50
        noise = (i * 37) % 101
        out.append({"date": d.isoformat(), "value": base_value + noise, "symbol": symbol.upper()})
    return out


@tool
def showFlightStatus(flightNumber: str) -> dict[str, Any]:
    """
    Get the status of a flight.
    """
    return {
        "flightNumber": flightNumber.upper(),
        "status": "On Time",
        "source": "LAX",
        "destination": "SFO",
        "departure": "10:15 AM",
        "arrival": "11:45 AM",
        "gate": "A12",
        "seat": "14C",
    }


@tool
def startVendorOnboarding(
    companyName: Optional[str] = None,
    category: Optional[str] = None,
) -> dict[str, Any]:
    """
    Start a multi-step vendor onboarding flow with validation.
    """
    allowed = {"software", "consulting", "hardware", "services", "other", None}
    cat = category if category in allowed else "other"
    return {"companyName": companyName, "category": cat}


TOOLS = [showStockInformation, showFlightStatus, startVendorOnboarding]

PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a helpful assistant that can answer questions and help with tasks"),
        ("user", "{input}"),
    ]
)

# Model setup
llm = ChatOpenAI(model=OPENAI_MODEL, temperature=0, api_key=OPENAI_API_KEY)
llm_with_tools = llm.bind_tools(TOOLS)

# Add a parser so streaming yields text, not AIMessageChunk
final_text_chain = PROMPT | llm | StrOutputParser()

# ---------- Helpers ----------

def _sse(payload: Dict[str, Any]) -> bytes:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n".encode("utf-8")


def _extract_user_text(messages: List[dict]) -> str:
    """
    UI messages: [{ role, parts: [{ type: 'text', text }, ...] }, ...]
    Return the most recent user text.
    """
    for m in reversed(messages):
        if m.get("role") == "user":
            for p in m.get("parts", []):
                if p.get("type") == "text":
                    return p.get("text", "")
    return ""


async def _final_text_stream(summary_text: str) -> AsyncIterable[bytes]:
    """
    Stream the final assistant text as text-* parts.
    Now yields string tokens thanks to StrOutputParser.
    """
    text_id = f"text_{uuid.uuid4().hex}"
    yield _sse({"type": "text-start", "id": text_id})
    async for token in final_text_chain.astream({"input": summary_text}):
        if token:
            yield _sse({"type": "text-delta", "id": text_id, "delta": token})
            await asyncio.sleep(0)
    yield _sse({"type": "text-end", "id": text_id})


async def _maybe_run_tool(user_text: str) -> Optional[Dict[str, Any]]:
    """
    Ask the model whether a tool should run. Execute the first tool call if present.
    """
    ai_msg = await (PROMPT | llm_with_tools).ainvoke({"input": user_text})
    tool_calls = getattr(ai_msg, "tool_calls", None)
    if not tool_calls:
        return None

    tc = tool_calls[0]
    name = tc.get("name")
    args = tc.get("args", {}) or {}
    tool_fn = next((t for t in TOOLS if t.name == name), None)
    if tool_fn is None:
        return None

    output = tool_fn.func(**args)
    return {
        "tool_call_id": f"call_{uuid.uuid4().hex}",
        "tool_name": name,
        "tool_input": args,
        "tool_output": output,
    }

@app.get("/healthz")
def healthz() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(request: Request) -> StreamingResponse:
    body = await request.json()
    messages = body.get("messages", [])
    initial_user_text = _extract_user_text(messages)

    async def event_stream() -> AsyncIterable[bytes]:
        # Required start event
        yield _sse({"type": "start", "messageId": f"msg_{uuid.uuid4().hex}"})

        # Optional lightweight reasoning preview
        reason_id = f"reason_{uuid.uuid4().hex}"

        yield _sse({"type": "reasoning-start", "id": reason_id})
        yield _sse({"type": "reasoning-delta", "id": reason_id, "delta": "Analyzing user request and intent."})
        yield _sse({"type": "reasoning-end", "id": reason_id})

        # Run tool if the model asks for it
        phase = await _maybe_run_tool(initial_user_text)
        summary_text = initial_user_text

        if phase:
            yield _sse({
                "type": "tool-input-start",
                "toolCallId": phase["tool_call_id"],
                "toolName": phase["tool_name"],
            })
            yield _sse({
                "type": "tool-input-available",
                "toolCallId": phase["tool_call_id"],
                "toolName": phase["tool_name"],
                "input": phase["tool_input"],
            })
            yield _sse({
                "type": "tool-output-available",
                "toolCallId": phase["tool_call_id"],
                "output": phase["tool_output"],
            })

            # Emit typed data-* blocks useful for UI rendering
            tool_name = phase["tool_name"]
            if tool_name == "showStockInformation":
                yield _sse({"type": "data-stocks", "data": phase["tool_output"]})
            elif tool_name == "showFlightStatus":
                yield _sse({"type": "data-flight", "data": phase["tool_output"]})
            elif tool_name == "startVendorOnboarding":
                yield _sse({"type": "data-onboarding", "data": phase["tool_output"]})

            yield _sse({"type": "finish-step"})

            summary_text = (
                f"{initial_user_text}\n\nTool result ({tool_name}): "
                f"{json.dumps(phase['tool_output'])}\n"
                "Write a concise, helpful final answer."
            )

        # Final streamed assistant text
        async for part in _final_text_stream(summary_text):
            yield part

        # Finish and terminator
        yield _sse({"type": "finish"})
        yield b"data: [DONE]\n\n"

    headers = {
        "x-vercel-ai-ui-message-stream": "v1",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }
    return StreamingResponse(event_stream(), media_type="text/event-stream", headers=headers)