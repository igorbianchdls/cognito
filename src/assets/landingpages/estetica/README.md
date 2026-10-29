# Lumière Estética Avançada

Frontend demonstrativo para uma clínica de estética, baseado na referência fornecida pelo usuário. Entra no diretório na categoria "Clínica de estética".

## Acesso

Execute o desenvolvimento normal do projeto e acesse `/estetica`. A página é pública e usa somente dados demonstrativos. Nenhuma integração de backend foi adicionada.

## Conteúdo

- `EsteticaApp.tsx`: interface, navegação, agenda por profissional, formulários, ficha do cliente e páginas de dados.
- `EsteticaApp.module.css`: identidade visual isolada (vidro claro e vidro escuro sobre a foto na visão geral; páginas claras nas demais abas).
- `data.ts`: tipos e dados iniciais (procedimentos com retorno recomendado, profissionais, um ano de atendimentos e as próximas três semanas, produtos e despesas) gerados a partir da data atual.
- `Art.tsx`: logo, ilustrações dos procedimentos e dos módulos.
- `fonts.ts`: fonte serifada dos títulos (DM Serif Display); o restante usa Geist.
- `public/estetica-media`: foto da clínica enviada pelo usuário.
- `src/app/estetica/page.tsx`: entrada no App Router.

As alterações são persistidas no `localStorage` sob `lumiere-estetica-v1`. Em Relatórios é possível exportar CSV e backup JSON, restaurar os dados de exemplo e ajustar a meta mensal.

## Abas

- **Visão Geral**: foto de fundo, resumo do mês, procedimentos em destaque, módulos e, abaixo, agenda de hoje, ocupação da semana e retornos a agendar.
- **Agendamentos**: agenda do dia em colunas por profissional (clique num horário vazio para agendar) e lista dos próximos dias; o agendamento verifica conflitos e sugere horários livres; o atendimento pode ser confirmado, concluído com pagamento, marcado como falta ou cancelado.
- **Clientes**: segmentos (retorno pendente, aniversariantes, inativas) e ficha com anamnese, histórico e próxima visita.
- **Procedimentos**, **Produtos** (insumos e revenda, com reposição), **Financeiro** e **Relatórios** (comissões por profissional, faltas, origem dos clientes).
