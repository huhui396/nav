"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

type Platform = "x" | "linkedin" | "instagram" | "newsletter" | "email";

interface HistoryRow {
  id: number;
  original_text: string;
  generated_x_posts: string;
  generated_linkedin: string;
  generated_instagram: string;
  generated_newsletter: string;
  generated_email: string;
  is_favorited: boolean;
  duration_ms: number;
  created_at: string;
}

interface GenerateResult {
  id: number;
  xPosts: string[];
  linkedin: string;
  instagram: string;
  newsletter: string;
  emailSubject: string;
  durationMs: number;
  usage: number;
  plan: "free" | "pro";
  limit: number;
  isFavorited: boolean;
}

interface UsageInfo {
  usage: number;
  plan: "free" | "pro";
  limit: number;
}

const PLATFORMS: { key: Platform; label: string; icon: string }[] = [
  { key: "x", label: "X / Twitter", icon: "𝕏" },
  { key: "linkedin", label: "LinkedIn", icon: "in" },
  { key: "instagram", label: "Instagram", icon: "◎" },
  { key: "newsletter", label: "Newsletter", icon: "✉" },
  { key: "email", label: "Email Subject", icon: "◈" },
];

function StarButton({ isFavorited, onClick, disabled }: { isFavorited: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`transition-colors text-base ${isFavorited ? "text-yellow-400 hover:text-yellow-300" : "text-white/20 hover:text-yellow-400"} disabled:opacity-50`}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorited ? "★" : "☆"}
    </button>
  );
}

export default function Home() {
  const { user, isLoaded } = useUser();

  // Input
  const [inputMode, setInputMode] = useState<"text" | "url">("text");
  const [inputText, setInputText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlFetched, setUrlFetched] = useState(false);

  // Generation
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [activeTab, setActiveTab] = useState<Platform>("x");

  // Copy
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // History
  const [historyTab, setHistoryTab] = useState<"all" | "favorites">("all");
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Usage
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);

  // Favoriting
  const [favoritingId, setFavoritingId] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.rows) setHistory(data.rows as HistoryRow[]);
    } catch { /* non-critical */ }
    finally { setHistoryLoading(false); }
  }, [user]);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/user/usage");
      const data = await res.json();
      setUsageInfo(data);
    } catch { /* non-critical */ }
  }, [user]);

  useEffect(() => {
    if (user) { fetchHistory(); fetchUsage(); }
  }, [user, fetchHistory, fetchUsage]);

  async function fetchUrl() {
    if (!urlInput.trim() || urlLoading) return;
    setUrlLoading(true);
    setUrlFetched(false);
    setError(null);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch URL");
      setInputText(data.text);
      setUrlFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch URL");
    } finally {
      setUrlLoading(false);
    }
  }

  async function handleGenerate() {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLimitReached(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (res.status === 402) { setLimitReached(true); return; }
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setResult({ ...data, isFavorited: false } as GenerateResult);
      setActiveTab("x");
      setUsageInfo({ usage: data.usage, plan: data.plan, limit: data.limit });
      fetchHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(id: number, fromResult = false) {
    setFavoritingId(id);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (fromResult && result) {
        setResult({ ...result, isFavorited: data.isFavorited });
      }
      setHistory((prev) =>
        prev.map((row) => row.id === id ? { ...row, is_favorited: data.isFavorited } : row)
      );
    } catch { /* non-critical */ }
    finally { setFavoritingId(null); }
  }

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const displayedHistory = historyTab === "favorites"
    ? history.filter((r) => r.is_favorited)
    : history;

  function getResultContent(tab: Platform): string {
    if (!result) return "";
    if (tab === "x") return result.xPosts.join("\n\n---\n\n");
    if (tab === "linkedin") return result.linkedin;
    if (tab === "instagram") return result.instagram;
    if (tab === "newsletter") return result.newsletter;
    return result.emailSubject;
  }

  function getHistoryContent(row: HistoryRow, tab: Platform): string {
    if (tab === "x") {
      try { return (JSON.parse(row.generated_x_posts) as string[]).join("\n\n---\n\n"); } catch { return row.generated_x_posts; }
    }
    if (tab === "linkedin") return row.generated_linkedin;
    if (tab === "instagram") return row.generated_instagram || "(Generated before multi-platform update)";
    if (tab === "newsletter") return row.generated_newsletter || "(Generated before multi-platform update)";
    return row.generated_email || "(Generated before multi-platform update)";
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-sm font-bold">R</div>
            <span className="font-semibold text-lg tracking-tight">Repurpose<span className="text-violet-400">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-xs text-white/40 hover:text-white/70 transition-colors">Pricing</Link>
            {isLoaded && (
              user ? (
                <div className="flex items-center gap-3">
                  {usageInfo && usageInfo.plan === "free" && (
                    <span className="text-xs text-white/40">{usageInfo.usage}/{usageInfo.limit} free</span>
                  )}
                  {usageInfo?.plan === "pro" && (
                    <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">PRO</span>
                  )}
                  <UserButton />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button className="text-xs px-4 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 transition-colors border border-white/10">
                    Sign in
                  </button>
                </SignInButton>
              )
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
            ✦ One article → 5 platforms, instant
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            One article.{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Infinite reach.</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Paste text or drop a URL — instantly get X threads, LinkedIn, Instagram, Newsletter & Email Subject, all at once.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-white/30">
            {PLATFORMS.map((p) => (
              <span key={p.key} className="flex items-center gap-1">
                <span className="text-white/50">{p.icon}</span> {p.label}
              </span>
            ))}
          </div>
        </section>

        {/* Input Card */}
        <section className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6 space-y-4">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-white/5 w-fit">
            <button
              onClick={() => { setInputMode("text"); setUrlFetched(false); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${inputMode === "text" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
            >
              📝 Paste text
            </button>
            <button
              onClick={() => setInputMode("url")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${inputMode === "url" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
            >
              🔗 From URL
            </button>
          </div>

          {/* URL input */}
          {inputMode === "url" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setUrlFetched(false); }}
                  onKeyDown={(e) => e.key === "Enter" && fetchUrl()}
                  placeholder="https://example.com/article..."
                  className="flex-1 bg-black/40 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
                <button
                  onClick={fetchUrl}
                  disabled={urlLoading || !urlInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm font-medium hover:bg-white/12 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                >
                  {urlLoading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  ) : "Fetch"}
                </button>
              </div>
              {urlFetched && (
                <p className="text-xs text-emerald-400">
                  ✓ Fetched {inputText.trim().split(/\s+/).filter(Boolean).length} words — ready to generate
                </p>
              )}
            </div>
          )}

          {/* Text area — shown in text mode, or after URL fetch */}
          {(inputMode === "text" || urlFetched) && (
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your article, blog post, or any long-form content here..."
              rows={8}
              className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/20 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30">
              {inputText.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            {!isLoaded ? null : !user ? (
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                  <span>✦</span> Sign in to Generate
                </button>
              </SignInButton>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading || inputText.trim().length < 20}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/25 transition-all"
              >
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Generating...</>
                ) : (<><span>✦</span> Generate for 5 Platforms</>)}
              </button>
            )}
          </div>
        </section>

        {/* Limit Reached */}
        {limitReached && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-6 py-5 text-center space-y-3">
            <p className="font-semibold text-violet-300">You&apos;ve used all {FREE_LIMIT} free generations this month</p>
            <p className="text-sm text-white/50">Upgrade to Pro for unlimited generations at $9.9/month.</p>
            <Link href="/pricing" className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all">
              Upgrade to Pro →
            </Link>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">{error}</div>
        )}

        {/* Results */}
        {result && (
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Your Social Pack</h2>
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{result.durationMs}ms</span>
              {result.plan === "free" && (
                <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{result.usage}/{result.limit} used</span>
              )}
              {result.id && (
                <StarButton
                  isFavorited={result.isFavorited}
                  onClick={() => toggleFavorite(result.id, true)}
                  disabled={favoritingId === result.id}
                />
              )}
            </div>

            {/* Platform tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-black/30 border border-white/5 overflow-x-auto w-full" style={{scrollbarWidth:"none"}}>
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setActiveTab(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === p.key ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-white/40 hover:text-white/60"}`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="relative rounded-xl border border-white/8 bg-white/3 p-5">
              <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed pr-8">{getResultContent(activeTab)}</p>
              <button
                onClick={() => copyToClipboard(getResultContent(activeTab), `result-${activeTab}`)}
                className="absolute top-4 right-4 text-white/20 hover:text-violet-400 transition-colors text-xs"
              >
                {copiedKey === `result-${activeTab}` ? "✓" : "⎘"}
              </button>
            </div>
          </section>
        )}

        {/* History */}
        {user && (
          <section className="space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-white/5">
                <button
                  onClick={() => setHistoryTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${historyTab === "all" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
                >
                  History
                  {!historyLoading && <span className="ml-1.5 text-white/30">{history.length}</span>}
                </button>
                <button
                  onClick={() => setHistoryTab("favorites")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${historyTab === "favorites" ? "bg-yellow-400/10 text-yellow-300" : "text-white/40 hover:text-white/60"}`}
                >
                  ★ Favorites
                  {!historyLoading && <span className="ml-1.5 text-white/30">{history.filter(r => r.is_favorited).length}</span>}
                </button>
              </div>
            </div>

            {historyLoading ? (
              <div className="flex items-center gap-3 text-white/30 text-sm py-8 justify-center">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Loading...
              </div>
            ) : displayedHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/8 py-12 text-center text-white/25 text-sm">
                {historyTab === "favorites" ? "No favorites yet. Star a generation to save it here." : "No history yet. Generate your first social pack above!"}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedHistory.map((row) => (
                  <HistoryItem
                    key={row.id}
                    row={row}
                    copiedKey={copiedKey}
                    favoritingId={favoritingId}
                    onCopy={copyToClipboard}
                    onFavorite={toggleFavorite}
                    getContent={getHistoryContent}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-white/5 mt-24 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-white/20">
          <span>RepurposeAI — AI Content Repurposing Tool</span>
          <Link href="/pricing" className="hover:text-white/40 transition-colors">Pricing</Link>
        </div>
      </footer>
    </div>
  );
}

const FREE_LIMIT = 10;

function HistoryItem({
  row,
  copiedKey,
  favoritingId,
  onCopy,
  onFavorite,
  getContent,
}: {
  row: HistoryRow;
  copiedKey: string | null;
  favoritingId: number | null;
  onCopy: (text: string, key: string) => void;
  onFavorite: (id: number) => void;
  getContent: (row: HistoryRow, tab: Platform) => string;
}) {
  const [activeTab, setActiveTab] = useState<Platform>("x");

  return (
    <details className="rounded-xl border border-white/8 bg-white/2 group">
      <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between hover:bg-white/3 rounded-xl transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-violet-400 text-xs font-mono shrink-0">#{row.id}</span>
          <span className="text-sm text-white/70 truncate">{row.original_text.slice(0, 70)}…</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-xs text-white/25">{new Date(row.created_at).toLocaleDateString()}</span>
          <StarButton
            isFavorited={row.is_favorited}
            onClick={() => onFavorite(row.id)}
            disabled={favoritingId === row.id}
          />
          <span className="text-white/20 text-xs group-open:rotate-180 transition-transform">▾</span>
        </div>
      </summary>
      <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
        <p className="text-xs text-white/40 bg-black/30 rounded-lg p-3 line-clamp-2">{row.original_text}</p>

        {/* Platform tabs */}
        <div className="flex gap-1 flex-wrap">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              onClick={() => setActiveTab(p.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${activeTab === p.key ? "bg-violet-500/20 text-violet-300" : "text-white/30 hover:text-white/50 bg-white/3"}`}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <div className="relative rounded-lg bg-black/30 p-3">
          <p className="text-xs text-white/60 whitespace-pre-wrap leading-relaxed pr-6">{getContent(row, activeTab)}</p>
          <button
            onClick={() => onCopy(getContent(row, activeTab), `hist-${row.id}-${activeTab}`)}
            className="absolute top-3 right-3 text-white/20 hover:text-violet-400 transition-colors text-xs"
          >
            {copiedKey === `hist-${row.id}-${activeTab}` ? "✓" : "⎘"}
          </button>
        </div>
      </div>
    </details>
  );
}
