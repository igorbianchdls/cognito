CREATE SCHEMA IF NOT EXISTS trafegopago;

CREATE TABLE IF NOT EXISTS trafegopago.cargas (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  plataforma character varying NOT NULL,
  origem_conector character varying NOT NULL DEFAULT 'fivetran',
  carga_externa_id character varying,
  periodo_inicio date,
  periodo_fim date,
  status character varying NOT NULL DEFAULT 'running',
  linhas_recebidas integer,
  linhas_processadas integer,
  erro_texto text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  iniciado_em timestamp with time zone NOT NULL DEFAULT now(),
  finalizado_em timestamp with time zone,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trafegopago_cargas_status_chk
    CHECK (status::text = ANY (ARRAY['pending', 'running', 'success', 'partial', 'error']::text[]))
);

CREATE UNIQUE INDEX IF NOT EXISTS trafegopago_cargas_externa_unq
  ON trafegopago.cargas (tenant_id, plataforma, origem_conector, carga_externa_id)
  WHERE carga_externa_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS trafegopago_cargas_tenant_idx
  ON trafegopago.cargas (tenant_id);

CREATE INDEX IF NOT EXISTS trafegopago_cargas_status_idx
  ON trafegopago.cargas (status);

CREATE INDEX IF NOT EXISTS trafegopago_cargas_periodo_idx
  ON trafegopago.cargas (periodo_inicio, periodo_fim);


CREATE TABLE IF NOT EXISTS trafegopago.contas_midia (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  plataforma character varying NOT NULL,
  conta_externa_id character varying NOT NULL,
  nome_conta character varying NOT NULL,
  moeda character varying NOT NULL DEFAULT 'BRL',
  fuso_horario character varying,
  status character varying,
  ativo boolean NOT NULL DEFAULT true,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ultimo_sync_em timestamp with time zone,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trafegopago_contas_midia_unq
    UNIQUE (tenant_id, plataforma, conta_externa_id)
);

CREATE INDEX IF NOT EXISTS trafegopago_contas_midia_tenant_idx
  ON trafegopago.contas_midia (tenant_id);

CREATE INDEX IF NOT EXISTS trafegopago_contas_midia_plataforma_idx
  ON trafegopago.contas_midia (plataforma);

CREATE INDEX IF NOT EXISTS trafegopago_contas_midia_ativo_idx
  ON trafegopago.contas_midia (ativo);


CREATE TABLE IF NOT EXISTS trafegopago.campanhas (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  conta_id bigint NOT NULL,
  plataforma character varying NOT NULL,
  campanha_externa_id character varying NOT NULL,
  nome character varying NOT NULL,
  status character varying,
  objetivo character varying,
  data_inicio date,
  data_fim date,
  ativo boolean NOT NULL DEFAULT true,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ultimo_sync_em timestamp with time zone,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trafegopago_campanhas_conta_fk
    FOREIGN KEY (conta_id)
    REFERENCES trafegopago.contas_midia(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT trafegopago_campanhas_unq
    UNIQUE (tenant_id, plataforma, campanha_externa_id)
);

CREATE INDEX IF NOT EXISTS trafegopago_campanhas_tenant_idx
  ON trafegopago.campanhas (tenant_id);

CREATE INDEX IF NOT EXISTS trafegopago_campanhas_conta_idx
  ON trafegopago.campanhas (conta_id);

CREATE INDEX IF NOT EXISTS trafegopago_campanhas_plataforma_idx
  ON trafegopago.campanhas (plataforma);

CREATE INDEX IF NOT EXISTS trafegopago_campanhas_status_idx
  ON trafegopago.campanhas (status);

CREATE INDEX IF NOT EXISTS trafegopago_campanhas_ativo_idx
  ON trafegopago.campanhas (ativo);


CREATE TABLE IF NOT EXISTS trafegopago.grupos_anuncio (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  conta_id bigint NOT NULL,
  campanha_id bigint NOT NULL,
  plataforma character varying NOT NULL,
  grupo_externo_id character varying NOT NULL,
  nome character varying NOT NULL,
  status character varying,
  data_inicio date,
  data_fim date,
  ativo boolean NOT NULL DEFAULT true,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ultimo_sync_em timestamp with time zone,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trafegopago_grupos_conta_fk
    FOREIGN KEY (conta_id)
    REFERENCES trafegopago.contas_midia(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT trafegopago_grupos_campanha_fk
    FOREIGN KEY (campanha_id)
    REFERENCES trafegopago.campanhas(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT trafegopago_grupos_anuncio_unq
    UNIQUE (tenant_id, plataforma, grupo_externo_id)
);

CREATE INDEX IF NOT EXISTS trafegopago_grupos_tenant_idx
  ON trafegopago.grupos_anuncio (tenant_id);

CREATE INDEX IF NOT EXISTS trafegopago_grupos_conta_idx
  ON trafegopago.grupos_anuncio (conta_id);

CREATE INDEX IF NOT EXISTS trafegopago_grupos_campanha_idx
  ON trafegopago.grupos_anuncio (campanha_id);

CREATE INDEX IF NOT EXISTS trafegopago_grupos_plataforma_idx
  ON trafegopago.grupos_anuncio (plataforma);

CREATE INDEX IF NOT EXISTS trafegopago_grupos_status_idx
  ON trafegopago.grupos_anuncio (status);

CREATE INDEX IF NOT EXISTS trafegopago_grupos_ativo_idx
  ON trafegopago.grupos_anuncio (ativo);


CREATE TABLE IF NOT EXISTS trafegopago.anuncios (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  conta_id bigint NOT NULL,
  campanha_id bigint NOT NULL,
  grupo_id bigint NOT NULL,
  plataforma character varying NOT NULL,
  anuncio_externo_id character varying NOT NULL,
  nome character varying NOT NULL,
  status character varying,
  creative_tipo character varying,
  ativo boolean NOT NULL DEFAULT true,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ultimo_sync_em timestamp with time zone,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trafegopago_anuncios_conta_fk
    FOREIGN KEY (conta_id)
    REFERENCES trafegopago.contas_midia(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT trafegopago_anuncios_campanha_fk
    FOREIGN KEY (campanha_id)
    REFERENCES trafegopago.campanhas(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT trafegopago_anuncios_grupo_fk
    FOREIGN KEY (grupo_id)
    REFERENCES trafegopago.grupos_anuncio(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT trafegopago_anuncios_unq
    UNIQUE (tenant_id, plataforma, anuncio_externo_id)
);

CREATE INDEX IF NOT EXISTS trafegopago_anuncios_tenant_idx
  ON trafegopago.anuncios (tenant_id);

CREATE INDEX IF NOT EXISTS trafegopago_anuncios_conta_idx
  ON trafegopago.anuncios (conta_id);

CREATE INDEX IF NOT EXISTS trafegopago_anuncios_campanha_idx
  ON trafegopago.anuncios (campanha_id);

CREATE INDEX IF NOT EXISTS trafegopago_anuncios_grupo_idx
  ON trafegopago.anuncios (grupo_id);

CREATE INDEX IF NOT EXISTS trafegopago_anuncios_plataforma_idx
  ON trafegopago.anuncios (plataforma);

CREATE INDEX IF NOT EXISTS trafegopago_anuncios_status_idx
  ON trafegopago.anuncios (status);

CREATE INDEX IF NOT EXISTS trafegopago_anuncios_ativo_idx
  ON trafegopago.anuncios (ativo);


CREATE TABLE IF NOT EXISTS trafegopago.desempenho_diario (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  carga_id bigint,
  data_ref date NOT NULL,
  plataforma character varying NOT NULL,
  nivel character varying NOT NULL,
  moeda character varying NOT NULL DEFAULT 'BRL',
  conta_id bigint,
  campanha_id bigint,
  grupo_id bigint,
  anuncio_id bigint,
  conta_externa_id character varying,
  campanha_externa_id character varying,
  grupo_externo_id character varying,
  anuncio_externo_id character varying,
  impressoes bigint NOT NULL DEFAULT 0,
  cliques bigint NOT NULL DEFAULT 0,
  alcance bigint,
  frequencia numeric(18,6),
  gasto numeric(18,4) NOT NULL DEFAULT 0,
  conversoes numeric(18,4),
  leads numeric(18,4),
  receita_atribuida numeric(18,4),
  payload_raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trafegopago_desempenho_carga_fk
    FOREIGN KEY (carga_id)
    REFERENCES trafegopago.cargas(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT trafegopago_desempenho_conta_fk
    FOREIGN KEY (conta_id)
    REFERENCES trafegopago.contas_midia(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT trafegopago_desempenho_campanha_fk
    FOREIGN KEY (campanha_id)
    REFERENCES trafegopago.campanhas(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT trafegopago_desempenho_grupo_fk
    FOREIGN KEY (grupo_id)
    REFERENCES trafegopago.grupos_anuncio(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT trafegopago_desempenho_anuncio_fk
    FOREIGN KEY (anuncio_id)
    REFERENCES trafegopago.anuncios(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT trafegopago_desempenho_nivel_chk
    CHECK (nivel::text = ANY (ARRAY['campaign', 'ad_group', 'ad']::text[])),
  CONSTRAINT trafegopago_desempenho_metricas_chk
    CHECK (
      impressoes >= 0
      AND cliques >= 0
      AND (alcance IS NULL OR alcance >= 0)
      AND (frequencia IS NULL OR frequencia >= 0)
      AND gasto >= 0
      AND (conversoes IS NULL OR conversoes >= 0)
      AND (leads IS NULL OR leads >= 0)
      AND (receita_atribuida IS NULL OR receita_atribuida >= 0)
    )
);

CREATE INDEX IF NOT EXISTS trafegopago_desempenho_tenant_idx
  ON trafegopago.desempenho_diario (tenant_id);

CREATE INDEX IF NOT EXISTS trafegopago_desempenho_data_idx
  ON trafegopago.desempenho_diario (data_ref);

CREATE INDEX IF NOT EXISTS trafegopago_desempenho_tenant_data_idx
  ON trafegopago.desempenho_diario (tenant_id, data_ref);

CREATE INDEX IF NOT EXISTS trafegopago_desempenho_plataforma_idx
  ON trafegopago.desempenho_diario (plataforma);

CREATE INDEX IF NOT EXISTS trafegopago_desempenho_nivel_idx
  ON trafegopago.desempenho_diario (nivel);

CREATE INDEX IF NOT EXISTS trafegopago_desempenho_conta_idx
  ON trafegopago.desempenho_diario (conta_id);

CREATE INDEX IF NOT EXISTS trafegopago_desempenho_campanha_idx
  ON trafegopago.desempenho_diario (campanha_id);

CREATE INDEX IF NOT EXISTS trafegopago_desempenho_grupo_idx
  ON trafegopago.desempenho_diario (grupo_id);

CREATE INDEX IF NOT EXISTS trafegopago_desempenho_anuncio_idx
  ON trafegopago.desempenho_diario (anuncio_id);

CREATE UNIQUE INDEX IF NOT EXISTS trafegopago_desempenho_diario_grain_unq
  ON trafegopago.desempenho_diario (
    tenant_id,
    plataforma,
    nivel,
    data_ref,
    COALESCE(conta_externa_id, ''),
    COALESCE(campanha_externa_id, ''),
    COALESCE(grupo_externo_id, ''),
    COALESCE(anuncio_externo_id, '')
  );
