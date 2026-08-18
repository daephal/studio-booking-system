"use client";

import { useState } from "react";

export function PasswordGate({ slug, studioName }: { slug: string; studioName: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/gallery/${slug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || "비밀번호가 올바르지 않습니다.");
        return;
      }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center bg-bg px-4 text-text">
      <h1 className="text-xl font-semibold">{studioName}</h1>
      <p className="mt-2 text-sm text-text-muted">갤러리 입장을 위해 비밀번호(연락처 뒤 4자리)를 입력해주세요.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          autoFocus
          className="jp-input w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-xs text-[#e08a8a]">{error}</p>}
        <button type="submit" disabled={loading} className="jp-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold">
          입장하기
        </button>
      </form>
    </div>
  );
}
