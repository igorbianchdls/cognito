# Lumière Moda Feminina

Frontend demonstrativo para uma loja de moda feminina, baseado na referência fornecida pelo usuário. Convive com a Alma (`/roupas`) na mesma categoria do diretório.

## Acesso

Execute o desenvolvimento normal do projeto e acesse `/moda`. A página é pública e usa somente dados demonstrativos. Nenhuma integração de backend foi adicionada.

## Conteúdo

- `LumiereApp.tsx`: interface, navegação, cadastros, venda (PDV), gavetas de produto e cliente e páginas de dados.
- `LumiereApp.module.css`: identidade visual isolada (vidro claro e vidro escuro sobre a foto na visão geral; páginas claras nas demais abas).
- `data.ts`: tipos e dados iniciais (catálogo com grade de tamanho e cor, clientes, um ano de vendas, campanhas e despesas) gerados a partir da data atual.
- `Art.tsx`: logo, ilustrações das peças e dos módulos.
- `fonts.ts`: fonte serifada dos títulos (DM Serif Display); o restante usa Geist.
- `public/moda-media`: foto da loja enviada pelo usuário.
- `src/app/moda/page.tsx`: entrada no App Router.

As alterações são persistidas no `localStorage` sob `lumiere-moda-v1`. Em Relatórios é possível exportar CSV e backup JSON, restaurar os dados de exemplo e ajustar a meta mensal.

## Abas

- **Visão Geral**: foto de fundo, resumo do mês, estoque em destaque, módulos (produtos, clientes, estoque, marketing) e, abaixo, estoque por categoria, evolução do faturamento e o dia na loja.
- **Produtos**: grade ou lista do catálogo; a gaveta mostra a grade de estoque editável e as últimas vendas.
- **Clientes**: segmentos (VIP, aniversariantes, inativas) e histórico por cliente, com atalho para WhatsApp.
- **Estoque**: reposição sugerida (lança a conta do fornecedor) e estoque por categoria.
- **Marketing**: campanhas com cupom, receita atribuída e aniversariantes do mês.
- **Financeiro** e **Relatórios**: vendas, despesas, resultado, canais, vendedoras e melhores clientes.

Registrar uma venda baixa o estoque da variação vendida e aceita o cupom de uma campanha ativa.
