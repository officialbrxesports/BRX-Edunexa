"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Check,
  Copy,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

type Action =
  | "rewrite"
  | "improve"
  | "summarize"
  | "continue"
  | "formal"
  | "friendly"
  | "academic"
  | "simple"
  | "to_hindi"
  | "to_english";

const actions: { id: Action; label: string }[] = [
  { id: "rewrite", label: "Rewrite" },
  { id: "improve", label: "Improve writing" },
  { id: "summarize", label: "Summarize" },
  { id: "continue", label: "Continue writing" },
  { id: "formal", label: "Formal tone" },
  { id: "friendly", label: "Friendly tone" },
  { id: "academic", label: "Academic tone" },
  { id: "simple", label: "Simple language" },
  { id: "to_hindi", label: "Translate to Hindi" },
  { id: "to_english", label: "Translate to English" },
];

function getParagraphContent(value: string) {
  return value.split(/\r?\n/).map((line) => ({
    type: "paragraph",
    content: line ? [{ type: "text", text: line }] : [],
  }));
}

interface AIWritingPanelProps {
  editor: Editor;
  onClose: () => void;
}

export default function AIWritingPanel({
  editor,
  onClose,
}: AIWritingPanelProps) {
  // Capture the editor selection before the panel receives focus.
  const initialSelection = editor.state.selection;

  const selectedText = editor.state.doc.textBetween(
    initialSelection.from,
    initialSelection.to,
    "\n",
  );

  const [input, setInput] = useState(
    selectedText || editor.getText(),
  );

  const [result, setResult] = useState("");
  const [activeAction, setActiveAction] = useState<Action>("improve");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  // Preserve the original selection while the user interacts with the panel.
  const [selectionRange] = useState(() => ({
    from: initialSelection.from,
    to: initialSelection.to,
    wasSelected: !initialSelection.empty,
  }));

  async function generate(action: Action) {
    if (!input.trim()) {
      setError("Please enter or select some text first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setApplied(false);
    setActiveAction(action);

    try {
      const response = await fetch("/api/ai-writing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          text: input,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI request failed.");
      }

      if (!data.result || typeof data.result !== "string") {
        throw new Error("AI returned an empty or invalid response.");
      }

      setResult(data.result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  function applyResult() {
    if (!result.trim()) return;

    const paragraphs = getParagraphContent(result.trim());

    try {
      if (selectionRange.wasSelected) {
        editor
          .chain()
          .focus()
          .insertContentAt(
            {
              from: selectionRange.from,
              to: selectionRange.to,
            },
            paragraphs,
          )
          .run();
      } else {
        editor.commands.setContent({
          type: "doc",
          content: paragraphs,
        });
      }

      setApplied(true);
      setError("");
    } catch {
      setError("Could not apply the result to the document.");
    }
  }

  async function copyResult() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result);
      setError("");
    } catch {
      setError(
        "Could not copy the result. Please select and copy it manually.",
      );
    }
  }

  return (
    <aside
      className="fixed right-0 top-0 z-[60] flex h-screen w-full max-w-[420px] flex-col border-l border-slate-200 bg-white shadow-2xl"
      aria-label="BRX AI Writing panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-[#174ea6] px-4 py-4 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={20} />

          <div>
            <h2 className="font-semibold">BRX AI Writing</h2>
            <p className="text-[11px] text-blue-100">
              Powered by local Qwen AI
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI writing panel"
          className="rounded-lg p-2 transition hover:bg-white/15"
        >
          <X size={19} />
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Input */}
        <div>
          <label
            htmlFor="ai-writing-input"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Your text
          </label>

          <textarea
            id="ai-writing-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setApplied(false);
            }}
            rows={7}
            maxLength={20_000}
            placeholder="Select text in your document or type here..."
            className="w-full resize-y rounded-lg border border-slate-300 p-3 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <p className="mt-1 text-right text-xs text-slate-400">
            {input.length.toLocaleString()} / 20,000 characters
          </p>
        </div>

        {/* AI actions */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Choose an AI action
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={loading || !input.trim()}
                onClick={() => void generate(action.id)}
                className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition ${
                  activeAction === action.id
                    ? "border-blue-400 bg-blue-50 text-blue-800"
                    : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            <Loader2 size={18} className="animate-spin" />
            Qwen AI is working. This may take a little time...
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* AI result */}
        {result && (
          <section className="rounded-xl border border-blue-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">
                AI result preview
              </h3>

              <button
                type="button"
                onClick={() => void copyResult()}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
              >
                <Copy size={14} />
                Copy
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-sm leading-6 text-slate-700">
              {result}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyResult}
                disabled={applied}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-green-700"
              >
                <Check size={16} />
                {applied ? "Applied to document" : "Replace in document"}
              </button>

              <button
                type="button"
                onClick={() => void generate(activeAction)}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <p className="text-xs leading-5 text-slate-400">
          AI output can contain mistakes. Review the result before applying
          it. Your text is processed by Ollama running on this computer.
        </p>
      </div>
    </aside>
  );
}