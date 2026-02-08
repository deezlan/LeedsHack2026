"use client";

import { useState } from "react";

type Props = {
  text: string;
  selectedTags: string[];
  onChangeTags: (tags: string[]) => void;
};

export default function SuggestTags({ text, selectedTags, onChangeTags }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<string[]>([]);

  async function handleSuggest() {
    setLoading(true);
    setError(null);
    setSuggested([]);

    try {
      const res = await fetch("/api/ai/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to suggest tags");

      setSuggested(Array.isArray(data?.suggestedTags) ? data.suggestedTags : []);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function toggle(tag: string) {
    if (selectedTags.includes(tag)) {
      onChangeTags(selectedTags.filter((t) => t !== tag));
    } else {
      onChangeTags([...selectedTags, tag]);
    }
  }

  const disabled = loading || text.trim().length < 3;

  return (
    <div style={{ border: "1px solid #eee", padding: 12, borderRadius: 10, marginTop: 12 }}>
      <button type="button" onClick={handleSuggest} disabled={disabled}>
        {loading ? "Thinking..." : "Suggest Tags"}
      </button>

      {text.trim().length < 3 && (
        <p style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          Type a bit more detail to get tag suggestions.
        </p>
      )}

      {error && <p style={{ marginTop: 8 }}>{error}</p>}

      {suggested.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ marginBottom: 8 }}>Suggested:</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {suggested.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #ccc",
                    opacity: active ? 1 : 0.75,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {active ? "✓ " : ""}{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
