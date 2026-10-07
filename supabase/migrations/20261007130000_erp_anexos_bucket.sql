BEGIN;

-- Bucket privado dos anexos do ERP. Sem políticas para anon/authenticated: o acesso acontece
-- somente pelo servidor (service role), que confere a empresa e gera links assinados curtos.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('erp-anexos', 'erp-anexos', false, 26214400)
ON CONFLICT (id) DO UPDATE SET public = false;

COMMIT;
