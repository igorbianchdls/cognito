# Categorias de clientes e fornecedores — 06/10/2026

Foram criadas **17 categorias** na empresa demonstrativa 2: nove para os 30 clientes e oito para os 15 fornecedores. Todos os cadastros existentes dessa base foram classificados pelo ramo indicado nos nomes fictícios.

## Distribuição

| Tipo | Categoria | Cadastros |
| --- | --- | ---: |
| Cliente | Comércio e distribuição | 6 |
| Cliente | Comunicação e eventos | 2 |
| Cliente | Construção e imóveis | 4 |
| Cliente | Educação e editoras | 3 |
| Cliente | Hotelaria e alimentação | 2 |
| Cliente | Logística e transportes | 2 |
| Cliente | Saúde | 5 |
| Cliente | Serviços profissionais | 5 |
| Cliente | Veterinária | 1 |
| Fornecedor | Contabilidade e assessoria | 1 |
| Fornecedor | Energia e telecomunicações | 2 |
| Fornecedor | Infraestrutura e instalações | 1 |
| Fornecedor | Marketing e comunicação | 1 |
| Fornecedor | Serviços técnicos | 3 |
| Fornecedor | Software e serviços digitais | 1 |
| Fornecedor | Tecnologia e equipamentos | 5 |
| Fornecedor | Transporte e mobilidade | 1 |

## Funcionamento

- `erp.categorias` aceita também os tipos `cliente` e `fornecedor`, definidos na migração `20261006030000_entity_category_types.sql`.
- A atribuição usa o campo já utilizado pelas listas e formulários: `erp.entidades.metadata.categoria`, contendo o nome da classificação. A associação atual é por nome; a alteração de nomes no catálogo exige atualizar também essas atribuições.
- Os cadastros mantêm seus identificadores e metadados demonstrativos. Foram incrementadas versões e registrados eventos com o usuário 3.
- A listagem e os indicadores de categorias contam também clientes e fornecedores associados.
- Site/API e o contrato de criação/edição de categorias do plugin reconhecem os novos tipos. Catálogos de receitas, despesas, produtos e serviços continuam filtrados pelas respectivas finalidades.

## Aplicação e validação

`scripts/erp/classify-demo-entities.mjs` verifica projeto, empresa, proprietário ativo e a base demonstrativa esperada. Primeiro foi executado `--check`, com as alterações revertidas. Em seguida, `--apply --project=mtadnxqoqxzbdksktwdr` gravou as 17 categorias e as 45 atribuições em uma transação.

As tabelas comerciais, financeiras, de estoque e fiscais foram comparadas antes/depois e preservadas. As categorias anteriores e os demais campos dos clientes/fornecedores também foram preservados.

Verificações:

- Tipos ERP e plugin aprovados.
- Consultas reais dos repositórios e detalhes pelo MCP aprovadas.
- Nove respostas HTTP da versão preparada aprovadas com sessão Clerk real: listas, opções, indicadores, contagens e catálogos financeiros.
- Versão preparada compilada na Vercel e publicada: `dpl_CCk6jo6pVkgQYpp1AKmLeSgsdssE`.
- As mesmas nove respostas HTTP foram aprovadas no domínio principal, com sessão Clerk real, após a publicação.
- A repetição da verificação criou zero categorias e alterou zero cadastros: aplicação sem duplicações.
- Evidências privadas e cópia dos registros anteriores em `.cache/entity-categories`.

Esses testes de MCP usam a identidade de teste carregada do vínculo real no banco; não representam uma conexão OAuth dentro do ChatGPT.
