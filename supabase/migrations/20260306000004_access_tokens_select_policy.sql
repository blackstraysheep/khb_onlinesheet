-- 20260306000004_access_tokens_select_policy.sql
-- access_tokens の SELECT を anon に許可（管理画面でトークン一覧を表示するため）
-- トークン自体は推測困難なランダム値であり、一覧表示はadmin画面でのみ使用

CREATE POLICY "anon_select_access_tokens"
    ON public.access_tokens
    FOR SELECT
    TO anon
    USING (true);
