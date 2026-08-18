import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_TERMS_TITLE, DEFAULT_TERMS_SECTIONS, type TermsSection } from "@/lib/terms";

export interface Terms {
  title: string;
  sections: TermsSection[];
}

export const DEFAULT_TERMS: Terms = { title: DEFAULT_TERMS_TITLE, sections: DEFAULT_TERMS_SECTIONS };

export async function getTerms(): Promise<Terms> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return DEFAULT_TERMS;
  const { data } = await supabase.from("app_config").select("terms_title, terms_sections").eq("id", 1).maybeSingle();
  if (!data) return DEFAULT_TERMS;
  return {
    title: data.terms_title ?? DEFAULT_TERMS.title,
    sections: (data.terms_sections as TermsSection[] | null) ?? DEFAULT_TERMS.sections,
  };
}

export async function saveTerms(terms: Terms): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다");
  const { error } = await supabase
    .from("app_config")
    .update({ terms_title: terms.title, terms_sections: terms.sections })
    .eq("id", 1);
  if (error) throw error;
}
