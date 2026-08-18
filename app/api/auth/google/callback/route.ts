import { NextResponse } from "next/server";
import { saveRefreshTokenFromCode } from "@/lib/google-calendar";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${env.siteUrl}/admin/setup/google?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${env.siteUrl}/admin/setup/google?error=no_code`);
  }

  try {
    await saveRefreshTokenFromCode(code);
    return NextResponse.redirect(`${env.siteUrl}/admin/setup/google?success=1`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.redirect(`${env.siteUrl}/admin/setup/google?error=${encodeURIComponent(msg)}`);
  }
}
