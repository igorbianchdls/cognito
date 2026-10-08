// Escolhe o card pela tool que produziu o resultado; escritas usam revisão ou resultado.
export const viewsScript=String.raw`
const titles={buscar_cadastros:'Cadastros',obter_cadastro:'Cadastro',listar_vendas:'Vendas',obter_venda:'Venda',listar_compras:'Compras',obter_compra:'Compra',listar_notas_servico:'Notas de serviço',obter_nota_servico:'Nota de serviço',
  consultar_financeiro:'Contas',obter_titulo_financeiro:'Título financeiro',obter_parcela_financeira:'Parcela',listar_pagamentos:'Pagamentos',
  consultar_estoque:'Estoque',analisar_periodo:'Indicadores por mês',consultar_relatorio:'Relatório',resumo_erp:'Resumo da empresa',meu_acesso:'Suas empresas'};
const registrationTitles={clientes:'Clientes',fornecedores:'Fornecedores',vendedores:'Vendedores',produtos:'Produtos',servicos:'Serviços',categorias:'Categorias','contas-financeiras':'Contas financeiras',pagar:'Contas a pagar',receber:'Contas a receber'};
function heading(target,title,subtitle){target.append(element('h1',title));if(subtitle)target.append(element('p',subtitle,'sub'))}
function viewFor(tool,data){if(data&&typeof data.etapa==='string')return data.etapa==='executado'?renderResult:renderReview;
  if(tool==='meu_acesso'||Array.isArray(data.empresas))return renderAccess;if(tool==='resumo_erp')return renderOverview;
  if(tool==='analisar_periodo'||tool==='consultar_relatorio')return renderAnalysis;if(Array.isArray(data.records))return renderList;return renderDetails}
`
