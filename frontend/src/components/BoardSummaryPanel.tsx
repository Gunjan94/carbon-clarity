import { useState } from "react";
import { streamSummary, type ScenarioResult } from "../api";

export default function BoardSummaryPanel({ scenario }: { scenario: ScenarioResult }) {
  const [text, setText] = useState("");
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setText("");
    setSource("");
    setLoading(true);
    try {
      await streamSummary(
        scenario,
        (chunk) => setText((t) => t + chunk),
        (src) => setSource(src)
      );
    } catch (e) {
      setText("Unable to generate summary. " + String(e));
    } finally {
      setLoading(false);
    }
  }

  const badge =
    source === "bedrock"
      ? { label: "✨ Amazon Bedrock · Claude", color: "#12b886" }
      : source === "llm"
      ? { label: "✨ AI-generated", color: "#12b886" }
      : source === "offline-template"
      ? { label: "Grounded summary", color: "#7c8db5" }
      : source === "cache"
      ? { label: "Cached", color: "#f59f00" }
      : null;

  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text2">
          AI Board Summary
        </h3>
        {badge && (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: badge.color + "22", color: badge.color }}
          >
            {badge.label}
          </span>
        )}
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Generating…" : "Generate board summary"}
      </button>

      <div className="mt-4 min-h-[140px] rounded-xl bg-panel2 p-4 text-[15px] leading-relaxed text-text1">
        {text ? (
          <p>
            {text}
            {loading && <span className="animate-pulse">▍</span>}
          </p>
        ) : (
          <p className="text-text2">
            Click generate to stream a board-ready narrative of the chosen plan,
            grounded strictly in the computed scenario numbers.
          </p>
        )}
      </div>
    </div>
  );
}
