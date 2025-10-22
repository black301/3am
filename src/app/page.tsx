"use client";
import { useState, useRef } from "react";
import type React from "react";

import { Play, Copy, Check } from "lucide-react";

// ChronoScript language keywords and data
const CHRONOSCRIPT_KEYWORDS = {
  keywords: [
    "startClock",
    "schedule",
    "tickout",
    "tickin",
    "when",
    "otherwise",
    "repeat",
    "loop",
    "finish",
    "#import",
    "timeline",
  ],
  types: ["second", "minute", "moment", "flag"],
  examples: [
    "startClock() { ... }",
    "schedule alarm() { ... }",
    "tickout 'message'",
    "tickin variable",
    "when (condition)",
    "repeat (condition)",
    "loop (init; condition; increment)",
  ],
};

interface Suggestion {
  text: string;
  type: "keyword" | "type" | "example";
}

export default function ChronoScriptEditor() {
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCode(value);

    // Get the last word being typed
    const lines = value.split("\n");
    const currentLine = lines[lines.length - 1];
    const words = currentLine.split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase();

    if (lastWord.length > 0) {
      const filtered: Suggestion[] = [];

      // Filter keywords
      CHRONOSCRIPT_KEYWORDS.keywords.forEach((kw) => {
        if (kw.toLowerCase().startsWith(lastWord)) {
          filtered.push({ text: kw, type: "keyword" });
        }
      });

      // Filter types
      CHRONOSCRIPT_KEYWORDS.types.forEach((type) => {
        if (type.toLowerCase().startsWith(lastWord)) {
          filtered.push({ text: type, type: "type" });
        }
      });

      // Filter examples
      CHRONOSCRIPT_KEYWORDS.examples.forEach((ex) => {
        if (ex.toLowerCase().startsWith(lastWord)) {
          filtered.push({ text: ex, type: "example" });
        }
      });

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestion(0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestion((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (suggestions[selectedSuggestion]) {
          insertSuggestion(suggestions[selectedSuggestion].text);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  // Insert suggestion into code
  const insertSuggestion = (suggestion: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const lines = code.split("\n");
    const currentLine = lines[lines.length - 1];
    const words = currentLine.split(/\s+/);
    const lastWord = words[words.length - 1];

    const newCode = code.slice(0, -lastWord.length) + suggestion + " ";
    setCode(newCode);
    setShowSuggestions(false);

    // Focus back to textarea
    setTimeout(() => textarea.focus(), 0);
  };

  // Handle scan
  async function handleScan() {
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOutput(data?.error ?? "Unknown server error");
      } else {
        setOutput(
          (data.stdout && String(data.stdout)) ||
            (data.stderr && String(data.stderr)) ||
            ""
        );
      }
    } catch (err) {
      setOutput(String(err));
    } finally {
      setLoading(false);
    }
  }

  // Copy output to clipboard
  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">⏰</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ChronoScript</h1>
              <p className="text-xs text-slate-400">Code Scanner & Executor</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="hidden sm:inline">v1.0</span>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Code Editor
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Write your ChronoScript code with autocomplete
                </p>
              </div>
            </div>

            {/* Editor Container */}
            <div className="relative flex-1 min-h-96 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
              {/* Line numbers */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-950 border-r border-slate-800 flex flex-col items-center pt-4 text-slate-600 text-sm font-mono select-none">
                {code.split("\n").map((_, i) => (
                  <div key={i} className="h-6 flex items-center justify-center">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="# Start typing ChronoScript code...&#10;startClock() {&#10;  schedule alarm() { ... }&#10;}"
                className="absolute inset-0 pl-16 pt-4 pb-4 pr-4 bg-transparent text-slate-100 font-mono text-sm resize-none focus:outline-none placeholder-slate-600"
                spellCheck="false"
              />

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute left-16 top-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 w-64 max-h-64 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => insertSuggestion(suggestion.text)}
                      className={`w-full text-left px-4 py-2 text-sm font-mono transition-colors ${
                        index === selectedSuggestion
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            suggestion.type === "keyword"
                              ? "bg-blue-500/30 text-blue-300"
                              : suggestion.type === "type"
                              ? "bg-purple-500/30 text-purple-300"
                              : "bg-cyan-500/30 text-cyan-300"
                          }`}
                        >
                          {suggestion.type}
                        </span>
                        <span>{suggestion.text}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleScan}
                disabled={loading || !code.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Play size={18} />
                {loading ? "Scanning..." : "Scan & Execute"}
              </button>
              <button
                onClick={() => setCode("")}
                disabled={!code.trim()}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:cursor-not-allowed text-slate-300 font-semibold rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Output</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Execution results and errors
                </p>
              </div>
              {output && (
                <button
                  onClick={handleCopyOutput}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Output Display */}
            <div className="flex-1 min-h-96 bg-slate-900 rounded-xl border border-slate-800 p-6 overflow-auto shadow-2xl">
              <pre className="font-mono text-sm text-slate-100 whitespace-pre-wrap break-words">
                {output || (
                  <span className="text-slate-500">
                    {loading
                      ? "⏳ Scanning your code..."
                      : "📝 Output will appear here after scanning"}
                  </span>
                )}
              </pre>
            </div>

            {/* Quick Reference */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Quick Reference
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-400">
                  <span className="text-blue-400 font-mono">schedule</span> -
                  Define function
                </div>
                <div className="text-slate-400">
                  <span className="text-purple-400 font-mono">second</span> -
                  Integer type
                </div>
                <div className="text-slate-400">
                  <span className="text-blue-400 font-mono">tickout</span> -
                  Output
                </div>
                <div className="text-slate-400">
                  <span className="text-purple-400 font-mono">moment</span> -
                  String type
                </div>
                <div className="text-slate-400">
                  <span className="text-blue-400 font-mono">when</span> - If
                  condition
                </div>
                <div className="text-slate-400">
                  <span className="text-purple-400 font-mono">flag</span> -
                  Boolean type
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Example Code Section */}
        <div className="mt-12 bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Example: Hello World
          </h3>
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="font-mono text-sm text-slate-100">
              {`#startclock timeline

schedule start() {
  tickout "Clock started — Welcome to ChronoScript!";
  finish 0;
}`}
            </pre>
          </div>
          <button
            onClick={() =>
              setCode(`#startclock timeline

schedule start() {
  tickout "Clock started — Welcome to ChronoScript!";
  finish 0;
}`)
            }
            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors"
          >
            Load Example
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-slate-500">
          <p>ChronoScript Code Scanner v1.0 • Built for developers</p>
        </div>
      </footer>
    </div>
  );
}
