-- access_tokens の anon SELECT ポリシーを削除
-- セキュリティ修正: anon ユーザーが全トークンを取得できる脆弱性を解消
-- トークン一覧は admin-list-judge-tokens Edge Function（admin_secret認証）経由で取得する

DROP POLICY IF EXISTS "anon_select_access_tokens" ON public.access_tokens;
