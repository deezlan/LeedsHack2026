"use client";

import { useState } from "react";
import SuggestTags from "@/components/ai/SuggestTags";

export default function AITestPage() {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>AI Tagging Test</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        style={{ width: "100%", padding: 10 }}
        placeholder='Try: "stuck on recursion base cases" or "need help with interview prep"'
      />

      <SuggestTags text={text} selectedTags={tags} onChangeTags={setTags} />

      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16 }}>Selected tags:</h2>
        <pre>{JSON.stringify(tags, null, 2)}</pre>
      </div>
    </div>
  );
}
