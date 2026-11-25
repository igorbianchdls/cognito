-- Perfil Compras passa a receber mercadoria (receber compra exige compras + estoque.movimentar, PE-06).
-- Ajustar estoque (estoque.ajustar) continua só nos perfis Administrador e Estoque.
INSERT INTO shared.permissoes_perfil(perfil_acesso_id, capability)
VALUES ('compras', 'erp.estoque.movimentar')
ON CONFLICT DO NOTHING;
