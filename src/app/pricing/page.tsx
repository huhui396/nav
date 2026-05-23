"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!user) { router.push("/sign-up"); return; }
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: billing }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  const monthlyPrice = billing === "yearly" ? "6.6" : "9.9";
  const billedAs = billing === "yearly" ? "Billed $79/year" : "Billed monthly";

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
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold">Simple, honest pricing</h1>
          <p className="text-white/50 text-lg">Start free. Upgrade when you&apos;re ready.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mt-6">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${billing === "monthly" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billing === "yearly" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
            >
              Yearly
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${billing === "yearly" ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-400"}`}>
                Save 33%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-8 space-y-6">
            <div>
              <p className="text-white/50 text-sm font-medium uppercase tracking-widest">Free</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-white/40 mb-1">/month</span>
              </div>
              <p className="text-white/30 text-xs mt-1">Forever free</p>
            </div>
            <ul className="space-y-3 text-sm text-white/70">
              {[
                "10 generations / month",
                "X/Twitter + LinkedIn posts",
                "Generation history",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href={user ? "/" : "/sign-up"}
              className="block w-full text-center py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
            >
              {user ? "Current plan" : "Get started free"}
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border border-violet-500/50 bg-gradient-to-b from-violet-500/10 to-transparent p-8 space-y-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full bg-violet-500 text-xs font-semibold whitespace-nowrap">
                ✦ MOST POPULAR
              </span>
            </div>
            <div>
              <p className="text-violet-300 text-sm font-medium uppercase tracking-widest">Pro</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-5xl font-bold">${monthlyPrice}</span>
                <span className="text-white/40 mb-1">/month</span>
              </div>
              <p className="text-white/30 text-xs mt-1">{billedAs}</p>
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
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-sm font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200"
            >
              {loading ? "Redirecting to checkout..." : `Get Pro — $${monthlyPrice}/mo`}
            </button>
            <p className="text-center text-white/25 text-xs">
              Cancel anytime · No hidden fees
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-xl mx-auto space-y-6">
          <h2 className="text-center text-lg font-semibold text-white/70">Frequently asked questions</h2>
          {[
            { q: "Can I cancel anytime?", a: "Yes, cancel anytime from your account settings. No questions asked." },
            { q: "What counts as a generation?", a: "Each time you click Generate Social Pack, that counts as one generation." },
            { q: "Do unused free generations roll over?", a: "No, the 10 free generations reset every month." },
            { q: "What payment methods do you accept?", a: "All major credit and debit cards via Stripe. 100% secure." },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-white/5 pb-6">
              <p className="font-medium text-sm mb-2">{q}</p>
              <p className="text-white/40 text-sm">{a}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/5 mt-24 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-white/20">
          <span>RepurposeAI</span>
          <Link href="/" className="hover:text-white/40 transition-colors">← Back to app</Link>
        </div>
      </footer>
    </div>
  );
}
