// supabase/functions/admin-setup-match/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS ヘッダ
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ENV のシークレットは前後の空白を削っておく
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey);

type JudgeInput = { name: string };

type RequestBody = {
  admin_secret?: string;
  match_code?: string;
  match_name?: string;
  judges?: JudgeInput[];
  max_uses?: number | null;
  token_prefix?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

// ランダムなトークンを生成
function generateToken(prefix = "khb-"): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return prefix + hex;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json().catch(() => null)) as RequestBody | null;

    const {
      admin_secret,
      match_code,
      match_name,
      judges,
      max_uses = null,
      token_prefix = "khb-",
    } = body ?? {};

    // 1. 管理用シークレット確認
    if (!adminSecret) {
      // ENV に何も入っていない場合はサーバ設定ミス
      return json(
        { error: "server misconfigured: ADMIN_SETUP_SECRET not set" },
        500,
      );
    }

    const clientSecret =
      typeof admin_secret === "string" ? admin_secret.trim() : "";

    if (!clientSecret || clientSecret !== adminSecret) {
      return json({ error: "unauthorized" }, 401);
    }

    // 2. 入力チェック
    if (!match_code || typeof match_code !== "string") {
      return json({ error: "match_code is required" }, 400);
    }
    if (!match_name || typeof match_name !== "string") {
      return json({ error: "match_name is required" }, 400);
    }
    if (!Array.isArray(judges) || judges.length === 0) {
      return json({ error: "judges array is required" }, 400);
    }

    // 3. 対戦を取得 or 作成（code で一意とみなす）
    let match_id: string;

    {
      const { data: existing, error: selErr } = await supabase
        .from("matches")
        .select("id, code, name")
        .eq("code", match_code)
        .maybeSingle();

      if (selErr) {
        console.error("matches select error", selErr);
        return json({ error: "failed to select match" }, 500);
      }

      if (existing) {
        match_id = existing.id as string;

        // 名前が変わっていたら更新
        if (existing.name !== match_name) {
          const { error: updErr } = await supabase
            .from("matches")
            .update({ name: match_name })
            .eq("id", match_id);
          if (updErr) {
            console.error("matches update error", updErr);
          }
        }
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from("matches")
          .insert({ code: match_code, name: match_name })
          .select("id, code, name")
          .single();

        if (insErr || !inserted) {
          console.error("matches insert error", insErr);
          return json({ error: "failed to insert match" }, 500);
        }
        match_id = inserted.id as string;
      }
    }

    // 4. 審査員ごとに judges / expected_judges / access_tokens を整備
    const judgeResults: {
      judge_id: string;
      judge_name: string;
      token: string;
      role: "judge";
    }[] = [];

    for (const j of judges) {
      const name = (j?.name || "").trim();
      if (!name) continue;

      // 4-1. judge を取得 or 作成（name で一意とみなす）
      let judge_id: string;

      {
        const { data: existing, error: selErr } = await supabase
          .from("judges")
          .select("id, name")
          .eq("name", name)
          .maybeSingle();

        if (selErr) {
          console.error("judges select error", selErr);
          return json(
            { error: `failed to select judge: ${name}` },
            500,
          );
        }

        if (existing) {
          judge_id = existing.id as string;
        } else {
          const { data: inserted, error: insErr } = await supabase
            .from("judges")
            .insert({ name })
            .select("id, name")
            .single();

          if (insErr || !inserted) {
            console.error("judges insert error", insErr);
            return json(
              { error: `failed to insert judge: ${name}` },
              500,
            );
          }
          judge_id = inserted.id as string;
        }
      }

      // 4-2. expected_judges に登録（重複は一旦削除してから insert）
      {
        const { error: delErr } = await supabase
          .from("expected_judges")
          .delete()
          .eq("match_id", match_id)
          .eq("judge_id", judge_id);

        if (delErr) {
          console.error("expected_judges delete error", delErr);
        }

        const { error: insErr } = await supabase
          .from("expected_judges")
          .insert({ match_id, judge_id });

        if (insErr) {
          console.error("expected_judges insert error", insErr);
          return json(
            {
              error: `failed to insert expected_judges for judge: ${name}`,
            },
            500,
          );
        }
      }

      // 4-3. access_tokens を発行
      const token = generateToken(token_prefix);

      {
        const { error: delErr } = await supabase
          .from("access_tokens")
          .delete()
          .eq("match_id", match_id)
          .eq("judge_id", judge_id)
          .eq("role", "judge");

        if (delErr) {
          console.error("access_tokens delete error", delErr);
        }

        const { error: insErr } = await supabase
          .from("access_tokens")
          .insert({
            token,
            match_id,
            judge_id,
            role: "judge",
            // epoch は現在は使っていないが、NOT NULL 制約があれば 1 を入れておく
            epoch: 1,
            max_uses: max_uses,
          });

        if (insErr) {
          console.error("access_tokens insert error", insErr);
          return json(
            { error: `failed to insert access_token for judge: ${name}` },
            500,
          );
        }
      }

      judgeResults.push({
        judge_id,
        judge_name: name,
        token,
        role: "judge",
      });
    }

    return json({
      ok: true,
      match: {
        id: match_id,
        code: match_code,
        name: match_name,
      },
      judge_tokens: judgeResults,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
