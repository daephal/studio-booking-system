"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SearchBox({ initialQuery }: { initialQuery?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery ?? "");

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="이름·장소·전화번호로 검색"
        className="adm-input w-full pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="검색어 지우기"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-adm-text-faint hover:text-adm-text"
        >
          ✕
        </button>
      )}
    </div>
  );
}
