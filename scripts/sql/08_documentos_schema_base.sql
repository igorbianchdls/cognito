CREATE SCHEMA IF NOT EXISTS documentos;

CREATE TABLE IF NOT EXISTS documentos.templates (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  codigo character varying NOT NULL,
  nome character varying NOT NULL,
  tipo character varying NOT NULL,
  descricao text,
  schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  layout_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  criado_por bigint,
  CONSTRAINT documentos_templates_tipo_chk
    CHECK (tipo::text = ANY (ARRAY['proposta', 'os', 'fatura', 'contrato', 'nfse', 'outro']::text[])),
  CONSTRAINT documentos_templates_codigo_unq
    UNIQUE (tenant_id, codigo)
);

CREATE TABLE IF NOT EXISTS documentos.template_versions (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  template_id bigint NOT NULL,
  versao integer NOT NULL,
  conteudo_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  publicado boolean NOT NULL DEFAULT false,
  publicado_em timestamp with time zone,
  notas text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  criado_por bigint,
  CONSTRAINT documentos_template_versions_template_fk
    FOREIGN KEY (template_id)
    REFERENCES documentos.templates(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT documentos_template_versions_unq
    UNIQUE (template_id, versao)
);

CREATE TABLE IF NOT EXISTS documentos.documentos (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  template_id bigint,
  template_version_id bigint,
  origem_tipo character varying NOT NULL,
  origem_id bigint NOT NULL,
  titulo character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'rascunho',
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  html_snapshot text,
  drive_file_id uuid,
  drive_signed_url text,
  mime character varying NOT NULL DEFAULT 'application/pdf',
  erro_texto text,
  gerado_em timestamp with time zone,
  enviado_em timestamp with time zone,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  criado_por bigint,
  CONSTRAINT documentos_documentos_template_fk
    FOREIGN KEY (template_id)
    REFERENCES documentos.templates(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT documentos_documentos_template_version_fk
    FOREIGN KEY (template_version_id)
    REFERENCES documentos.template_versions(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT documentos_documentos_drive_file_fk
    FOREIGN KEY (drive_file_id)
    REFERENCES drive.files(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT documentos_documentos_status_chk
    CHECK (status::text = ANY (ARRAY['rascunho', 'gerando', 'gerado', 'enviado', 'assinado', 'cancelado', 'erro']::text[]))
);

CREATE INDEX IF NOT EXISTS documentos_templates_tenant_idx
  ON documentos.templates (tenant_id);

CREATE INDEX IF NOT EXISTS documentos_templates_tipo_idx
  ON documentos.templates (tipo);

CREATE INDEX IF NOT EXISTS documentos_templates_ativo_idx
  ON documentos.templates (ativo);

CREATE INDEX IF NOT EXISTS documentos_template_versions_tenant_idx
  ON documentos.template_versions (tenant_id);

CREATE INDEX IF NOT EXISTS documentos_template_versions_template_idx
  ON documentos.template_versions (template_id);

CREATE INDEX IF NOT EXISTS documentos_template_versions_publicado_idx
  ON documentos.template_versions (publicado);

CREATE INDEX IF NOT EXISTS documentos_documentos_tenant_idx
  ON documentos.documentos (tenant_id);

CREATE INDEX IF NOT EXISTS documentos_documentos_status_idx
  ON documentos.documentos (status);

CREATE INDEX IF NOT EXISTS documentos_documentos_origem_idx
  ON documentos.documentos (origem_tipo, origem_id);

CREATE INDEX IF NOT EXISTS documentos_documentos_template_idx
  ON documentos.documentos (template_id, template_version_id);
