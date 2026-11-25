# Cadastros (CD)

Clientes, fornecedores, vendedores, transportadoras (todos são **entidades** com papéis), produtos, serviços, categorias de cadastro, tabelas de preço.
Caminhos relativos a `src/products/erp/server/`. Legenda no [README](README.md).

## Pessoas (entidades)

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CD-01 | Uma mesma pessoa pode ter vários papéis (cliente, fornecedor, vendedor, transportadora). Ex.: reembolso exige o cliente também como fornecedor (VD-55). | `erpRegistrationsRepository.ts` → `createEntityRoleRecord()` | "Tipo de entidade inválido." | 🧪 |
| CD-02 | CPF/CNPJ e código são únicos na empresa (entre cadastros não excluídos). | banco: índices únicos `entidades (empresa_id, documento)` e `(empresa_id, codigo)` | erro de duplicidade (`DUPLICATE_OPERATION`) | ❌ |
| CD-03 | E-mail e telefone ficam no contato principal; endereço no endereço principal (comercial/cobrança). Contato ou endereço só se ligam ao próprio cadastro. | `erpRegistrationRelations.ts` → `saveRegistrationRelations()`; chat: `schemas/actionContracts.ts` → `proposalValues()` | "Contato ou endereço não pertence a este cadastro." | 🧪 |
| CD-04 | Cliente tem limite de crédito (≥ 0 ou sem limite), bloqueio comercial (com motivo obrigatório) e tabela de preço da empresa. | **`regras/cadastros.ts` → `validarCondicoesCliente()`** (limite e bloqueio), via `erpCommercialRules.ts` → `saveCustomerCommercialTerms()`; a tabela de preço é conferida no banco | "Limite de crédito inválido." / "Informe o motivo do bloqueio comercial." | ✅ `regras/cadastros.test.ts` · 🧪 |
| CD-05 | Documentos (vendas, notas, OS) guardam fotografia do cliente; mudar o cadastro não altera documentos já feitos (NS-03, OS-10). | — | — | 🧪 |

## Produtos e serviços

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CD-10 | Produto e serviço exigem nome e preço; SKU e código são únicos na empresa. | chat: `schemas/actionContracts.ts`; banco: índices únicos `produtos (empresa_id, sku)`, `(empresa_id, codigo)` e `servicos (empresa_id, codigo)` | erro de duplicidade | 🧪 |
| CD-11 | Unidade de estoque com até 12 letras ou números (UN, KG, M2). | `erpRegistrationsRepository.ts` → `productStockUnit()` | "Informe uma unidade de estoque com até 12 letras ou números, como UN, KG ou M2." | ❌ |
| CD-12 | Serviço que vai para NFS-e precisa de código de tributação nacional (6 dígitos) e, se houver, NBS (9 dígitos), e categoria ativa de serviços. | `erpRegistrationsRepository.ts` → `digitsOf()`, `resolveServiceCategory()` | "O código de tributação nacional tem 6 dígitos …" / "O código NBS tem 9 dígitos." | ❌ |
| CD-13 | Produto inativo vira "pausado"; pessoa inativa vira "inativo". Serviço, categoria e conta não se inativam pelo chat. | chat: `editar_cadastro` | — | ❌ |

## Categorias de cadastro e tabelas de preço

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CD-20 | Categoria de cadastro é de produto, serviço, cliente ou fornecedor; subcategoria do mesmo tipo; no máximo 2 níveis. (Diferente da categoria **financeira**, CO-01.) | `erpRegistrationsRepository.ts` → `registrationCategoryValues()` | "Categoria de cadastro é de produto, serviço, cliente ou fornecedor." / "Categorias têm no máximo 2 níveis." | ❌ |
| CD-21 | Tabela de preço: sem item repetido na mesma faixa de quantidade; só se exclui se nenhum cliente a usa. | `erpCommercialRepository.ts` | "Item repetido na mesma faixa de quantidade." / "Tabela usada por N cliente(s); troque a tabela deles antes de excluir." | ❌ |

## Excluir

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CD-30 | Só se exclui cadastro **sem vínculos nem histórico** (vendas, compras, financeiro, estoque); com vínculos, o caminho é desativar. | `erpCrudRepository.ts` → `archiveRegistration()` | "Cadastro possui vínculos ou histórico. Use desativação no ERP para preservá-los." | ❌ (bloqueado por bug até 2026-11-25) |
| CD-31 | Para verificar vínculos, quem exclui precisa poder **consultar** vendas, compras, financeiro e estoque. | `archiveRegistration()` | "A exclusão de cadastro exige permissão de consulta nas áreas comerciais, financeira e de estoque para verificar vínculos." | 🧪 |
| CD-32 | Cadastro com mais de um papel não é excluído: desative o papel. Conta financeira com saldo inicial se desativa, não se exclui. | `archiveRegistration()` | "Cadastro com múltiplos papéis: desative o papel no ERP antes de excluir." / "Conta com saldo inicial deve ser desativada no ERP." | ❌ |

> Atenção: pela CD-31, os perfis **Vendas** e **Compras** podem criar cadastros, mas não conseguem excluir nenhum (não têm consulta de todas as áreas). Ver [permissoes.md](permissoes.md).
