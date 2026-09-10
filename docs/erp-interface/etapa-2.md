# Etapa 2 — Cadastros e relações

Implementação local em 09/09/2026, sem migrações, acesso ao Supabase, dados reais ou publicação.

## Implementado

- Clientes, fornecedores e vendedores possuem editor de múltiplos contatos e endereços. Contatos incluem nome, cargo, e-mail, telefone, WhatsApp e finalidades comercial, financeira e operacional. Endereços incluem identificação, endereço completo, país e finalidades comercial, cobrança e prestação do serviço.
- Cada finalidade permite um principal. Validações rejeitam duplicações, contatos sem e-mail/telefone e endereços sem identificação, logradouro ou cidade. Até 100 registros por coleção.
- Inclusão e edição dos filhos acontecem na transação do cadastro. A versão do cadastro protege a edição completa. Identificadores existentes são preservados; registros removidos ficam inativos. Omissão de uma coleção pela API preserva seus registros; uma coleção vazia remove seus vínculos ativos.
- Identificadores de outra empresa ou outro cadastro são rejeitados. Os campos permitidos dos filhos são validados antes de compor a gravação. Erros desfazem toda a transação.
- Eventos de cadastro registram as coleções anteriores e posteriores. Campos antigos de contato são preservados na atualização direta da entidade; as estruturas normalizadas e os mecanismos existentes do banco controlam sua atualização.
- A busca considera contatos e endereços ativos. As listas exibem e-mail, telefone e cidade provenientes das coleções normalizadas.
- Clientes, fornecedores, vendedores e serviços permitem editar a situação sem reativação involuntária ao salvar. Fornecedores possuem escolha explícita entre pessoa física e jurídica.
- Serviços selecionam categoria por identificador. O servidor verifica empresa, situação e finalidade da categoria. A compatibilidade com consumidores antigos que enviam o nome permanece, para adaptação dos produtores indiretos nas etapas seguintes.
- O formulário envia somente seus campos editáveis, aceita decimais e impede envio caso não consiga carregar as relações.

## Validação

`node scripts/erp/interface-foundation-smoke.mjs`: 20 cenários aprovados, incluindo a regressão da etapa 1, gravação e edição com contatos/endereço, conservação de identificadores, conflito de versão, vínculo indevido, rollback, busca por contato e categorias incompatíveis. Banco isolado PGlite com dados fictícios.

`tsconfig.erp.json`: verificação de tipos aprovada. O editor também passou por teste de renderização de componentes; não foi realizado teste visual interativo contra uma sessão real da aplicação.

Resultado: `etapa-2-testes.json`.

## Continuidade

Esta etapa adapta os cadastros existentes. Documentos comerciais e contratos seguem na etapa 3; posições e operações financeiras, na etapa 4; importadores, automações e demais produtores indiretos, na etapa 5. Não foram adicionadas funcionalidades fiscais ou de estoque, novas tabelas ou novas views.
