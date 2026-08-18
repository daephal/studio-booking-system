"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SetupNotice } from "@/components/SetupNotice";

export function AdminLoginForm({ studioName }: { studioName: string }) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/bootstrap-admin")
      .then((res) => res.json())
      .then((body) => setNeedsBootstrap(!body?.hasAdmin))
      .catch(() => setNeedsBootstrap(false))
      .finally(() => setCheckingAdmin(false));
  }, []);

  if (!supabase) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24">
        <SetupNotice
          items={["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]}
        />
      </div>
    );
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bootstrap-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error || "계정 생성 중 오류가 발생했습니다.");
        return;
      }
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) {
        setError("계정은 만들어졌지만 로그인에 실패했습니다. 방금 만든 정보로 다시 로그인해주세요.");
        setNeedsBootstrap(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (checkingAdmin) {
    return <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center bg-adm-bg px-4 text-adm-text" />;
  }

  if (needsBootstrap) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center bg-adm-bg px-4 text-adm-text">
        <h1 className="adm-h1">{studioName} 관리자 계정 만들기</h1>
        <p className="mt-2 text-sm text-adm-text-muted">
          처음 배포하셨네요. 앞으로 로그인에 사용할 이메일과 비밀번호를 정해주세요.
        </p>
        <form onSubmit={handleBootstrap} className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="이메일"
            autoFocus
            className="adm-input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호 (8자 이상)"
            className="adm-input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            className="adm-input w-full"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
          {error && <p className="text-xs text-[#e08a8a]">{error}</p>}
          <button type="submit" disabled={loading} className="adm-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold">
            {loading ? "만드는 중..." : "계정 만들고 시작하기"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center bg-adm-bg px-4 text-adm-text">
      <h1 className="adm-h1">{studioName} 관리자</h1>
      <form onSubmit={handleLogin} className="mt-6 space-y-3">
        <input type="email" placeholder="이메일" autoFocus className="adm-input w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="비밀번호" className="adm-input w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-xs text-[#e08a8a]">{error}</p>}
        <button type="submit" disabled={loading} className="adm-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold">
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
