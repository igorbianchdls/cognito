# Nexo, Alma e Torque

Três frontends demonstrativos, sem backend, baseados nas imagens aprovadas.

- `/assistencia`: Nexo, assistência técnica de eletrônicos.
- `/roupas`: Alma, loja de roupas.
- `/oficina`: Torque, gestão de oficina automotiva.

Os componentes comuns ficam em `src/assets/landingpages/gestao-demo`, e cada versão tem sua entrada em uma pasta própria de `landingpages` e em `src/app`. Fotografias locais extraídas das referências aprovadas ficam em `public/<rota>-media`.

## Funcionamento

Nexo e Torque: cadastro e edição de ordens, diagnóstico, peças com baixa e devolução ao estoque, agenda, clientes, equipe, orçamento, financeiro, entrega e garantia informada na OS, relatórios e exportação da OS. Pipeline permite arrastar cartões; formulários e seletores também atualizam as etapas. Peças vinculadas não alteram automaticamente o valor comercial da ordem. Lançamentos financeiros são separados do orçamento da OS.

Alma: venda com itens, tamanhos, cores, vendedor, pagamento e desconto; baixa de estoque com validação de disponibilidade; histórico de pedidos e etapas; produtos, coleções, clientes, compras e recebimento com reposição idempotente; devolução proporcional ao desconto, com retorno ao estoque e lançamento de reembolso; indicadores e equipe por vendedor; financeiro e exportações. Para troca, registrar a devolução e uma nova venda. Compra não gera automaticamente um pagamento: o financeiro tem cadastro próprio.

Cada sistema usa sua própria chave de localStorage e permite exportar backup JSON no menu do perfil. Notas e recados são locais; não há envio de mensagens a terceiros. Os comprovantes TXT são demonstrativos, sem valor fiscal. Não há integração fiscal, cobrança, autenticação de usuários, upload ou backend. As rotas são públicas e usam dados fictícios. O calendário e o painel abrem em outubro de 2026, mês de referência da demonstração.
