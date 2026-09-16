import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_HOST = "studentbooks.moe.gov.eg";
const MAX_BYTES = 25 * 1024 * 1024;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ar,en;q=0.8",
};

function isAllowedUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    if (u.hostname.toLowerCase() !== ALLOWED_HOST) return null;
    return u;
  } catch {
    return null;
  }
}

function parseListing(html: string, baseUrl: URL) {
  const folders: { name: string; url: string }[] = [];
  const files: { name: string; url: string }[] = [];
  const seen = new Set<string>();
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (!href || href.startsWith("?") || href.startsWith("#") || href.toLowerCase().startsWith("javascript:")) continue;
    let abs: URL;
    try {
      abs = new URL(href, baseUrl);
    } catch {
      continue;
    }
    if (abs.hostname.toLowerCase() !== ALLOWED_HOST) continue;
    if (abs.pathname === baseUrl.pathname || abs.pathname.length <= baseUrl.pathname.length) continue;
    const label = m[2].replace(/<[^>]*>/g, "").trim() || decodeURIComponent(abs.pathname.split("/").filter(Boolean).pop() || "");
    if (!label || /parent directory/i.test(label)) continue;
    const key = abs.href;
    if (seen.has(key)) continue;
    seen.add(key);
    if (/\.pdf$/i.test(abs.pathname)) {
      files.push({ name: decodeURIComponent(label), url: abs.href });
    } else if (abs.href.endsWith("/")) {
      folders.push({ name: decodeURIComponent(label), url: abs.href });
    }
  }
  return { folders, files };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body?.action === "import" ? "import" : "list";
    const url = isAllowedUrl(String(body?.url ?? ""));
    if (!url) {
      return new Response(JSON.stringify({ error: "invalid_url" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const res = await fetch(url.href, { headers: BROWSER_HEADERS, redirect: "follow" });
      if (!res.ok) {
        console.error("MOE listing failed", res.status);
        return new Response(JSON.stringify({ error: "source_unavailable", status: res.status }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const html = await res.text();
      const parsed = parseListing(html, url);
      return new Response(JSON.stringify({ ...parsed, url: url.href }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // import
    if (!/\.pdf$/i.test(url.pathname)) {
      return new Response(JSON.stringify({ error: "not_a_pdf" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(url.href, { headers: BROWSER_HEADERS, redirect: "follow" });
    if (!res.ok) {
      console.error("MOE download failed", res.status);
      return new Response(JSON.stringify({ error: "download_failed", status: res.status }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const buffer = new Uint8Array(await res.arrayBuffer());
    if (buffer.byteLength === 0) {
      return new Response(JSON.stringify({ error: "empty_file" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (buffer.byteLength > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "file_too_large" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawName = decodeURIComponent(url.pathname.split("/").pop() || "book.pdf");
    const safeName = rawName
      .replace(/[^\x00-\x7F]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") || "moe_book.pdf";
    const storagePath = `${user.id}/${Date.now()}_moe_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("learning-materials")
      .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });
    if (uploadError) {
      console.error("Storage upload failed", uploadError.message);
      return new Response(JSON.stringify({ error: "upload_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: material, error: insertError } = await supabase
      .from("uploaded_materials")
      .insert({
        user_id: user.id,
        file_name: rawName,
        file_type: "application/pdf",
        file_size: buffer.byteLength,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert material failed", insertError.message);
      return new Response(JSON.stringify({ error: "save_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ material }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("moe-books error:", error);
    return new Response(JSON.stringify({ error: "request_failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
