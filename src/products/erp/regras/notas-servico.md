# Notas de serviço — NFS-e simulada (NS)

Hoje toda NFS-e é **simulada**: sem validade fiscal, nada é enviado à prefeitura nem à Receita. As validações seguem o padrão da NFS-e Nacional (DPS), como um provedor real validaria.
Caminhos relativos a `src/products/erp/server/`. Legenda no [README](README.md).

## Ciclo de vida

```
rascunho → (emitir) → emitida
                    ↘ aguardando_retorno → (consultar retorno) → emitida | falha
                    ↘ falha → (corrigir/emitir de novo)
emitida → cancelada          rascunho → excluída
```

## Rascunho

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| NS-01 | Nota precisa de cliente ativo e serviços ativos da empresa, com descrição do serviço prestado. | `fiscal/serviceInvoiceRepository.ts` → `references()` | "Escolha um cliente ativo desta empresa." / "Escolha serviços ativos desta empresa." | 🧪 |
| NS-02 | Vinculada a uma venda: a venda é do mesmo cliente, está disponível, e os serviços/quantidades correspondem. | `references()` | "A venda deve pertencer a esse cliente e estar disponível." / "Os serviços e quantidades devem corresponder à venda vinculada." | ❌ |
| NS-03 | A nota guarda uma **fotografia do cliente** no rascunho; corrigir o cadastro depois não muda a nota sozinha — editar o rascunho atualiza a fotografia. | `serviceInvoiceRepository.ts` → criação/`editServiceInvoice()`; `prepareDps()` usa `destinatario_snapshot` | "CPF/CNPJ do cliente ausente ou inválido. Se o cadastro foi corrigido depois de criar o rascunho, edite a nota para atualizar o cliente." | 🧪 |
| NS-04 | Só rascunho é editável; versão antiga é recusada. | `editServiceInvoice()` | "Somente rascunhos disponíveis podem ser editados." / "A nota mudou. Consulte os dados atuais antes de confirmar." | 🧪 |
| NS-05 | Só rascunho é excluído, com motivo; nota emitida se cancela. | `actOnServiceInvoice()` | "Só rascunhos podem ser excluídos. Para notas emitidas, use cancelamento." / "Informe o motivo da exclusão." | 🧪 |

## Emitir (validação da DPS)

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| NS-10 | A empresa precisa de dados fiscais: CNPJ válido, razão social, inscrição municipal, regime tributário e código IBGE do município (7 dígitos). | `fiscal/nfseDps.ts` → `buildDps()` | "Cadastre os dados fiscais da empresa …" / "CNPJ da empresa ausente ou inválido." / "Informe a inscrição municipal da empresa." | 🧪 (empresa de teste configurada) |
| NS-11 | Cliente com CPF ou CNPJ válido (dígitos conferidos) e nome. | `buildDps()` | "CPF/CNPJ do cliente ausente ou inválido. …" / "Informe o nome do cliente." | 🧪 sem CPF recusado; com CPF emitido |
| NS-12 | Todos os itens com o mesmo código de tributação nacional de 6 dígitos (uma nota por tipo de serviço). | `buildDps()`; cadastro: `erpRegistrationsRepository.ts` | "Todos os itens da nota precisam ter o mesmo código de tributação nacional …" / "O código de tributação nacional tem 6 dígitos …" | ❌ |
| NS-13 | Local da prestação com código IBGE de 7 dígitos (não é CEP). | `buildDps()` | "Código IBGE do local da prestação deve ter 7 dígitos." | 🧪 |
| NS-14 | Total dos serviços > 0; alíquota de ISS entre 2% e 5%. | `buildDps()`; `actOnServiceInvoice()` | "O valor dos serviços deve ser maior que zero." / "Alíquota de ISS deve estar entre 2% e 5%." | 🧪 |
| NS-15 | Competência não pode ser futura, na data da empresa (GE-01). Vale para a emissão individual e para o lote. | **`regras/notas-servico.ts` → `validarCompetencia()`**, chamada por `fiscal/nfseDps.ts` → `buildDps()` (emissão) e `mcpcore/domains/erp/workflows/repository.ts` (lote) | "A competência não pode ser futura." / no lote: "Venda com competência futura ou ajustes de total exige preparar a nota individualmente no ERP." | ✅ `regras/notas-servico.test.ts` (inclui 22h em São Paulo) · 🧪 |
| NS-16 | Retenção de ISS e retenções federais só para tomador pessoa jurídica, e as retenções não passam do valor dos serviços. | `buildDps()` | "Retenção de ISS só ocorre quando o tomador é pessoa jurídica." / "As retenções não podem ser maiores que o valor dos serviços." | ❌ |
| NS-17 | Nota já enviada ou finalizada não é emitida de novo; pendente (aguardando retorno) se resolve consultando o retorno, nunca reemitindo. | `actOnServiceInvoice()` | "A nota já foi enviada ou finalizada." / "A nota não está aguardando resultado. …" | 🧪 cenário "demora" → consulta → emitida |
| NS-18 | Número da DPS sequencial por série da empresa. | `serviceInvoiceRepository.ts` → `prepareDps()` | — | 🧪 nº 16, 17, 18 |
| NS-19 | Ao autorizar, retenções de nota vinculada a venda abatem as parcelas a receber dessa venda (sem entrada de dinheiro). | `serviceInvoiceRepository.ts` | — | ❌ |

## Cancelar e lote

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| NS-20 | Só nota emitida é cancelada, com código do motivo (1 erro, 2 serviço não prestado, 9 outros) e justificativa de pelo menos 15 caracteres. Estorna abatimentos de retenção vinculados. | `actOnServiceInvoice()` | "Só notas simuladas emitidas podem ser canceladas." / "A justificativa do cancelamento precisa ter ao menos 15 caracteres." | 🧪 |
| NS-21 | Emissão em lote só para vendas de serviço confirmadas, com nota montada dos itens e totais exatos da venda; ajustes de total ou competência futura exigem emissão individual. Itens concluídos nunca são reenviados. | `mcpcore/domains/erp/workflows/repository.ts` | "Venda com competência futura ou ajustes de total exige preparar a nota individualmente no ERP." | 🧪 VEN-2026-0159 → nota nº 18 |
| NS-22 | XML só para nota autorizada (inclusive cancelada); PDF existe também para rascunho. Links expiram. | `getServiceInvoiceXml()`, `getServiceInvoicePdf()` | "XML disponível só para notas autorizadas." | 🧪 |
| NS-23 | Uma configuração fiscal por CNPJ. | `fiscal/fiscalSettings.ts` | "Já existe uma configuração fiscal com esse CNPJ." | ❌ |
