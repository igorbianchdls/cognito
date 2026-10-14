BEGIN;
ALTER TABLE erp.comissoes_pagamentos ADD COLUMN valor_ajustado numeric(18,2) NOT NULL DEFAULT 0 CHECK (valor_ajustado>=0 AND valor_ajustado<=valor);
ALTER TABLE erp.comissoes_pagamentos ADD COLUMN ajustes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(ajustes)='array');
ALTER TABLE erp.comissoes_pagamentos_itens ADD COLUMN valor_ajustado numeric(18,2) NOT NULL DEFAULT 0 CHECK (valor_ajustado>=0 AND valor_ajustado<=valor);
COMMIT;
