#!/usr/bin/env python3
"""
Test StudySphere AI Easter Egg and normal AI flow.
"""
import urllib.request
import urllib.error
import json
import sys
import time

BASE_URL = "http://localhost:8080/api/chat"

def ask_chat(messages):
    payload = {"messages": messages}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BASE_URL,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return res.get("reply", "")

def test_easter_egg():
    print("=" * 60)
    print("TESTING EASTER EGG & REGULAR AI RESPONSES")
    print("=" * 60)

    expected_easter_egg = "Mr.Bhavyam is the one and only supreme leader."

    # 1. Triggering Queries
    positive_prompts = [
        "Who is the supreme leader?",
        "who is the Supreme Leader?",
        "Tell me about the supreme leader",
        "Who's the supreme leader?",
        "supreme leader?",
        "supreme leader",
        "Who is the SUPREME LEADER of the world?"
    ]

    print("\n--- 1. Testing Triggering Queries ---")
    for prompt in positive_prompts:
        reply = ask_chat([{"role": "user", "content": prompt}])
        print(f"Query:  {prompt}")
        print(f"Reply:  {reply}")
        assert reply == expected_easter_egg, f"Expected exact match for '{prompt}', got: '{reply}'"
        print("✓ Passed!\n")

    # 2. Non-Triggering Queries (Must NOT return Easter egg)
    print("\n--- 2. Testing Non-Triggering Queries (Must NOT return Easter Egg) ---")
    negative_prompts = [
        "What is leadership?",
        "Who is the leader of a country?",
        "Explain leadership styles"
    ]
    for prompt in negative_prompts:
        time.sleep(1.5)
        reply = ask_chat([{"role": "user", "content": prompt}])
        print(f"Query:  {prompt}")
        print(f"Reply:  {reply[:120]}...")
        assert reply != expected_easter_egg, f"Query '{prompt}' should not trigger Easter egg!"
        assert "supreme leader" not in reply.lower() or "mr.bhavyam" not in reply.lower()
        print("✓ Verified: Passed through to normal AI flow.\n")

    # 3. Normal Academic AI Query (Checking existing AI integration works)
    print("\n--- 3. Testing Normal Academic Query ---")
    academic_query = "Solve 2x + 5 = 15"
    reply = ask_chat([{"role": "user", "content": academic_query}])
    print(f"Query:  {academic_query}")
    print(f"Reply:  {reply[:150]}...")
    assert reply != expected_easter_egg
    assert "5" in reply or "x = 5" in reply or "x=" in reply
    print("✓ Verified: Real academic AI answer generated.")

    print("\n" + "=" * 60)
    print("🎉 ALL EASTER EGG AND NORMAL AI TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    test_easter_egg()
