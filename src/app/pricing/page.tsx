"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!user) { router.push("/sign-up"); return; }
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-sm font-bold">R</div>
            <span className="font-semibold text-lg tracking-tight">Repurpose<span className="text-violet-400">AI</span></span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl font-bold">Simple, honest pricing</h1>
          <p className="text-white/50 text-lg">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-8 space-y-6">
            <div>
              <p className="text-white/50 text-sm font-medium uppercase tracking-widest">Free</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-white/40 mb-1">/month</span>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-white/70">
              {["5 generations per month", "X/Twitter + LinkedIn posts", "Generation history"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/sign-up" className="block w-full text-center py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors">
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-transparent p-8 space-y-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full bg-violet-500 text-xs font-semibold">MOST POPULAR</span>
            </div>
            <div>
              <p className="text-violet-300 text-sm font-medium uppercase tracking-widest">Pro</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-5xl font-bold">$9.9</span>
                <span className="text-white/40 mb-1">/month</span>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-white/70">
              {[
                "Unlimited generations",
                "X/Twitter + LinkedIn posts",
                "Full generation history",
                "Priority support",
                "Early access to new features",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-violet-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading || !isLoaded}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-sm font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              {loading ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
