# Avaliação da preparação fiscal para integração por API

> Avaliação histórica anterior às alterações. A preparação de schema e código foi concluída depois deste diagnóstico; consulte [a implementação de 06/10/2026](preparacao-fiscal-implementacao-20261006.md) para o estado atual, os testes e as etapas futuras de integração.

Data: 06/10/2026. Fonte principal: catálogo atual do Supabase e código do ERP. Consulta somente de leitura; nenhuma alteração de schema ou de dados.

## Conclusão

A estrutura pode ser aproveitada, mas não está pronta para uma integração fiscal completa em produção. São necessários ajustes de integração, ambientes e processamento de retornos. O conjunto está mais preparado para NF-e de mercadorias que para NFS-e de serviços.

As cinco tabelas existem e estão vazias, inclusive a configuração do emitente. Não houve teste de emissão, cancelamento ou webhook de um provedor.

## Estrutura existente

| Tabela em `erp` | Papel | Avaliação |
| --- | --- | --- |
| `configuracoes_fiscais` | Emitente, regime, endereço, ambiente, provedor e referência do segredo | Boa base; limitada à Focus e a uma configuração por empresa/CNPJ |
| `notas_fiscais` | Documento, origem comercial, destinatário, estado, número, série, chave, protocolo, valores e respostas | Boa base; completar identificação da integração e preservação histórica |
| `notas_fiscais_itens` | Descrição, quantidade, valores, NCM, CFOP, CST/CSOSN, código municipal, ISS e payload | Parcial; detalhar o perfil fiscal conforme os documentos emitidos |
| `notas_fiscais_totais` | Tributos de mercadorias, frete, seguro, desconto e despesas | Voltada a mercadorias; faltam campos explícitos de serviços e retenções |
| `notas_fiscais_eventos` | Histórico de eventos e respostas | Boa finalidade de auditoria; não funciona sozinha como fila de processamento |

### Pontos positivos confirmados

- Todas as tabelas têm RLS habilitada. As políticas distinguem configuração fiscal, notas de saída/vendas e notas de entrada/compras; os filhos seguem a visibilidade da nota.
- Referências compostas com `empresa_id` impedem vínculos de notas/itens/categorias fiscais a registros de outra empresa nas relações inspecionadas.
- Todas as restrições consultadas estão validadas.
- Existe referência única por empresa para emissão (`ref_focus`), unicidade de chave para notas de entrada e unicidade de hash de XML.
- Há campos para pedido enviado, resposta, erro, protocolo, datas e versão.
- O segredo do provedor é representado por referência (`token_secret_ref`), conforme a intenção documentada, em vez de uma coluna destinada ao token puro.
- Os eventos são protegidos contra alteração e exclusão.

## Ajustes antes da integração

### 1. Identificação do provedor e do ambiente

Os CHECKs de `configuracoes_fiscais.provedor` e `notas_fiscais_eventos.provedor` permitem apenas `focus_nfe`. Os campos `focus_empresa_ref`, `ref_focus` e `resposta_focus` também assumem esse provedor.

Recomendação: definir o provedor escolhido, usar identificação externa adequada e preservar provedor/ambiente no documento. Renomear campos específicos se a intenção for suportar APIs diferentes. A referência já existente deve continuar impedindo reenvios duplicados; os identificadores devem ter o escopo exigido pela API escolhida.

O índice `configuracoes_fiscais_cnpj_ativo_idx` é único em `(empresa_id, cnpj)` para registros não excluídos e não inclui `ambiente`. Portanto não permite duas configurações coexistentes, uma de teste e outra de produção, com o mesmo CNPJ. A projeção `fiscal_issuer_for_operations` seleciona configurações ativas sem receber um ambiente. Esses dois pontos precisam ser ajustados juntos.

### 2. Tentativas e retorno da API

Há unicidade da referência da nota, mas não existe identificador externo único de evento nem estrutura fiscal específica de tentativas/reenvios. É preciso tratar timeout após aceitação, conciliação por consulta, eventos repetidos e eventos fora de ordem.

O trigger `bloquear_mutacao_evento` rejeita qualquer UPDATE/DELETE em `notas_fiscais_eventos`. Isso também impede preencher `processado_em` ou alterar `erro_mensagem` depois de inserir um evento recebido. Preservar a auditoria imutável e separar o estado de processamento do retorno em uma inbox/estrutura operacional adequada.

A emissão assíncrona e a confirmação por consulta ou webhook estão documentadas na [API de NF-e da Focus](https://doc.focusnfe.com.br/reference/emitir_nfe). A referência é usada aqui como comparação com o provedor já assumido pelo schema; o usuário ainda não escolheu a API.

### 3. Campos de serviços e modelo fiscal

`tipo` aceita `nfse`, mas `notas_fiscais_totais` não tem base/valor de ISS, valor líquido ou retenções explícitas de serviços. O item possui código municipal e alíquota de ISS; isso não constitui um perfil fiscal completo.

Se houver NFS-e Nacional, definir os dados de DPS, competência, municípios e tributação nacional conforme o contrato escolhido. A [documentação da Focus para DPS Nacional](https://doc.focusnfe.com.br/reference/emitir_dps_nacional) mostra campos próprios, como número/série da DPS e código de tributação nacional do ISS. A inexistência de colunas específicas não impede enviar esses dados em JSON; porém valores e identificadores usados pelo ERP precisam de representação e validação consistentes.

Definir também se haverá diferenças entre NFS-e municipal e nacional, perfis fiscais por serviço/produto e mudanças de leiaute. Este parecer avalia a modelagem de software, não define alíquotas ou obrigações tributárias.

### 4. Integridade do documento e histórico

- `notas_fiscais_venda_tipo_unica_idx` permite uma nota não cancelada por venda/tipo. A regra restringe emissões parciais, várias notas de serviços e notas complementares vinculadas à mesma venda. Ajustar apenas após definir esses cenários.
- As FKs asseguram a empresa, mas não garantem sozinhas que o item comercial pertence à venda/compra vinculada à nota ou que o destinatário é coerente com a origem.
- Não há trigger fiscal de coerência entre total do documento, itens e tributos; as CHECKs observadas verificam principalmente valores não negativos.
- A nota e seus itens têm trigger de atualização de data, mas não proteção específica de conteúdo depois da autorização. Definir transições de estado e congelamento do conteúdo fiscal com exceções operacionais delimitadas.
- Preservar os dados exatos de emitente/destinatário, itens e configuração usados em cada emissão, mesmo que os cadastros mudem. Os payloads já existentes podem fazer parte dessa preservação, com contrato explícito.

### 5. Arquivos fiscais

Há URLs de XML/PDF/DANFE. A importação atual de NF-e salva o XML original dentro de `payload_enviado` e calcula seu hash. Porém o histórico de notas em `erpHistoryRepository` não tem associação de arquivos configurada, diferentemente de vendas e compras.

Completar a guarda e o acesso aos documentos originais, incluindo retornos de cancelamento e demais eventos aplicáveis, sem depender exclusivamente de um link fornecido pelo emissor.

## Código atual

- Existe parser de XML de NF-e e fluxo de importação de nota de compra com itens/totais.
- Existe pré-validação fiscal de venda; a própria UI a descreve como preparação para emissão futura.
- Não foi localizado um adaptador fiscal de emissão, consulta, cancelamento e webhook no código consultado.
- A pré-validação atual é básica e não substitui a validação do leiaute e do provedor. Por exemplo, a ausência de código municipal do serviço é apenas um aviso.

## Caminho recomendado

1. Escolher a API e os modelos atendidos primeiro: NF-e, NFC-e e/ou NFS-e municipal/nacional.
2. Preparar ambientes, identificação externa, tentativas e processamento de retornos, preservando as cinco tabelas existentes.
3. Completar os campos fiscais efetivamente usados pelos modelos escolhidos, a integridade e a guarda dos arquivos.
4. Implementar o adaptador e testar em homologação autorização, rejeição, timeout, retorno duplicado, consulta e cancelamento.

Não há motivo para excluir ou recriar essas cinco tabelas para começar. A aprovação de produção depende do contrato da API e dos testes de integração.
