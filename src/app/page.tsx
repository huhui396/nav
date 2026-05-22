"use client";

import { useState, useEffect, useCallback } from "react";

interface HistoryRow {
  id: number;
  original_text: string;
  generated_x_posts: string;
  generated_linkedin: string;
  duration_ms: number;
  created_at: string;
}

interface GenerateResult {
  xPosts: string[];
  linkedin: string;
  durationMs: number;
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.rows) setHistory(data.rows as HistoryRow[]);
    } catch {
      // history fetch failure is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function handleGenerate() {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setResult(data as GenerateResult);
      fetchHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-sm font-bold">
              R
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Repurpose<span className="text-violet-400">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Powered by AI
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
            ✦ Turn long-form content into viral social posts
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            One article.{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Infinite reach.
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Paste any blog post or article and instantly get 3 viral X/Twitter
            threads and a polished LinkedIn post — ready to publish.
          </p>
        </section>

        {/* Input Card */}
        <section className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6 space-y-4">
          <label className="text-sm text-white/60 font-medium">
            Your content
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your article, blog post, or any long-form content here..."
            rows={8}
            className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/20 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30">
              {inputText.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <button
              onClick={handleGenerate}
              disabled={loading || inputText.trim().length < 20}
              className="relative group flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <span>✦</span>
                  Generate Social Pack
                </>
              )}
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Your Social Pack</h2>
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                Generated in {result.durationMs}ms
              </span>
            </div>

            {/* X/Twitter Posts */}
            <div className="space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-widest font-medium">
                X / Twitter Posts
              </p>
              {result.xPosts.map((post, i) => (
                <div
                  key={i}
                  className="relative rounded-xl border border-white/8 bg-white/3 p-5 group"
                >
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed pr-8">
                    {post}
                  </p>
                  <button
                    onClick={() => copyToClipboard(post, i)}
                    className="absolute top-4 right-4 text-white/20 hover:text-violet-400 transition-colors text-xs"
                    title="Copy"
                  >
                    {copiedIndex === i ? "✓" : "⎘"}
                  </button>
                </div>
              ))}
            </div>

            {/* LinkedIn Post */}
            <div className="space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-widest font-medium">
                LinkedIn Post
              </p>
              <div className="relative rounded-xl border border-white/8 bg-white/3 p-5 group">
                <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed pr-8">
                  {result.linkedin}
                </p>
                <button
                  onClick={() => copyToClipboard(result.linkedin, 99)}
                  className="absolute top-4 right-4 text-white/20 hover:text-violet-400 transition-colors text-xs"
                  title="Copy"
                >
                  {copiedIndex === 99 ? "✓" : "⎘"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* History */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <h2 className="text-lg font-semibold">Generation History</h2>
            {!historyLoading && (
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                {history.length} records
              </span>
            )}
          </div>

          {historyLoading ? (
            <div className="flex items-center gap-3 text-white/30 text-sm py-8 justify-center">
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/8 py-12 text-center text-white/25 text-sm">
              No history yet. Generate your first social pack above!
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((row) => {
                let xPosts: string[] = [];
                try {
                  xPosts = JSON.parse(row.generated_x_posts);
                } catch {}
                return (
                  <details
                    key={row.id}
                    className="rounded-xl border border-white/8 bg-white/2 group"
                  >
                    <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between hover:bg-white/3 rounded-xl transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-violet-400 text-xs font-mono shrink-0">
                          #{row.id}
                        </span>
                        <span className="text-sm text-white/70 truncate">
                          {row.original_text.slice(0, 80)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs text-white/25">
                          {row.duration_ms}ms
                        </span>
                        <span className="text-xs text-white/25">
                          {new Date(row.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-white/20 text-xs group-open:rotate-180 transition-transform">
                          ▾
                        </span>
                      </div>
                    </summary>
                    <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                      <div>
                        <p className="text-xs text-white/30 mb-2">
                          Original text
                        </p>
                        <p className="text-xs text-white/50 bg-black/30 rounded-lg p-3 line-clamp-3">
                          {row.original_text}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/30 mb-2">
                          X/Twitter Posts
                        </p>
                        <div className="space-y-2">
                          {xPosts.map((p, i) => (
                            <p
                              key={i}
                              className="text-xs text-white/60 bg-black/30 rounded-lg p-3 whitespace-pre-wrap"
                            >
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-white/30 mb-2">
                          LinkedIn Post
                        </p>
                        <p className="text-xs text-white/60 bg-black/30 rounded-lg p-3 whitespace-pre-wrap line-clamp-4">
                          {row.generated_linkedin}
                        </p>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-24 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-white/20">
          <span>RepurposeAI — AI Content Repurposing Tool</span>
          <span>Built with Next.js + Turso + Netlify</span>
        </div>
      </footer>
    </div>
  );
}
