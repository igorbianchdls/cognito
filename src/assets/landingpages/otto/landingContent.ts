export const landingNavigation = [
  { href: '#beneficios', label: 'Benefícios' },
  { href: '#chatgpt-claude', label: 'ChatGPT e Claude' },
  { href: '#preco', label: 'Preço' },
  { href: '#duvidas', label: 'Dúvidas' },
]

export const productViews = [
  {
    id: 'financeiro',
    label: 'Financeiro',
    title: 'Controle o caixa sem perder vencimentos.',
    description: 'Contas a pagar e receber conectadas às vendas, compras e movimentações da empresa.',
    metrics: [
      { label: 'Saldo disponível', value: 'R$ 86.420', detail: '3 contas financeiras', tone: 'neutral' },
      { label: 'A receber', value: 'R$ 42.580', detail: '12 títulos em aberto', tone: 'positive' },
      { label: 'A pagar', value: 'R$ 18.230', detail: '7 próximos vencimentos', tone: 'warning' },
      { label: 'Resultado previsto', value: 'R$ 24.350', detail: 'Próximos 30 dias', tone: 'info' },
    ],
    columns: ['Descrição', 'Vencimento', 'Status', 'Valor'],
    rows: [
      ['Mensalidade Cliente Norte', 'Hoje', 'A receber', 'R$ 8.900,00'],
      ['Aluguel da unidade', '06 ago', 'Programado', 'R$ 4.800,00'],
      ['Fornecedor Alfa', '08 ago', 'A pagar', 'R$ 3.240,00'],
      ['Projeto Varejo', '12 ago', 'A receber', 'R$ 12.600,00'],
    ],
  },
  {
    id: 'operacao',
    label: 'Vendas e compras',
    title: 'Da negociação ao financeiro, sem retrabalho.',
    description: 'Registre itens, condições de pagamento e confirme documentos com geração financeira automática.',
    metrics: [
      { label: 'Vendas no mês', value: 'R$ 74.920', detail: '24 vendas confirmadas', tone: 'positive' },
      { label: 'Compras no mês', value: 'R$ 31.640', detail: '11 compras confirmadas', tone: 'warning' },
      { label: 'Ticket médio', value: 'R$ 3.121', detail: 'Alta de 8% no período', tone: 'info' },
      { label: 'Em aprovação', value: '6', detail: 'Documentos em rascunho', tone: 'neutral' },
    ],
    columns: ['Documento', 'Pessoa', 'Situação', 'Total'],
    rows: [
      ['Venda 0321', 'Mercado Sul', 'Confirmada', 'R$ 7.450,00'],
      ['Venda 0320', 'Cliente Norte', 'Rascunho', 'R$ 3.800,00'],
      ['Compra 0087', 'Fornecedor Alfa', 'Confirmada', 'R$ 6.120,00'],
      ['Compra 0086', 'Distribuidora Vale', 'Em análise', 'R$ 2.940,00'],
    ],
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    title: 'Clientes, fornecedores e produtos organizados.',
    description: 'Uma base única para a equipe trabalhar com dados consistentes em todos os processos.',
    metrics: [
      { label: 'Clientes ativos', value: '184', detail: '9 novos neste mês', tone: 'positive' },
      { label: 'Fornecedores', value: '47', detail: 'Todos atualizados', tone: 'neutral' },
      { label: 'Produtos', value: '326', detail: '12 categorias', tone: 'info' },
      { label: 'Serviços', value: '28', detail: 'Tabela comercial ativa', tone: 'warning' },
    ],
    columns: ['Cadastro', 'Tipo', 'Documento', 'Situação'],
    rows: [
      ['Mercado Sul Ltda.', 'Cliente', '12.345.678/0001-90', 'Ativo'],
      ['Fornecedor Alfa', 'Fornecedor', '21.345.678/0001-12', 'Ativo'],
      ['Consultoria mensal', 'Serviço', 'SV-0014', 'Ativo'],
      ['Licença profissional', 'Produto', 'PR-0082', 'Ativo'],
    ],
  },
  {
    id: 'documentos',
    label: 'Documentos fiscais',
    title: 'XMLs e documentos vinculados à operação.',
    description: 'Importe documentos fiscais de compra, valide dados e mantenha o histórico junto ao fornecedor.',
    metrics: [
      { label: 'XMLs importados', value: '38', detail: 'Neste mês', tone: 'positive' },
      { label: 'Validados', value: '36', detail: 'Sem divergências', tone: 'neutral' },
      { label: 'Em revisão', value: '2', detail: 'Aguardando conferência', tone: 'warning' },
      { label: 'Fornecedores vinculados', value: '24', detail: 'Mapeamento automático', tone: 'info' },
    ],
    columns: ['Documento', 'Fornecedor', 'Validação', 'Total'],
    rows: [
      ['NF-e 00001842', 'Fornecedor Alfa', 'Validado', 'R$ 6.120,00'],
      ['NF-e 00001836', 'Distribuidora Vale', 'Validado', 'R$ 2.940,00'],
      ['NF-e 00001831', 'Comercial Norte', 'Em revisão', 'R$ 1.780,00'],
      ['NF-e 00001822', 'Serviços Beta', 'Validado', 'R$ 890,00'],
    ],
  },
] as const

export const frequentlyAskedQuestions = [
  {
    question: 'Para quais empresas a Otto é indicada?',
    answer: 'A Otto foi desenhada para pequenas empresas que precisam organizar vendas, compras e financeiro sem implantar um sistema complexo.',
  },
  {
    question: 'Preciso substituir todos os sistemas que já uso?',
    answer: 'Não. Você pode começar pela operação financeira e conectar ou importar dados das ferramentas que já fazem parte da rotina da empresa.',
  },
  {
    question: 'A Otto já emite notas fiscais?',
    answer: 'Hoje a Otto organiza e valida documentos fiscais de entrada. A emissão por API está sendo preparada para uma próxima etapa do produto.',
  },
  {
    question: 'Como a Otto funciona com o ChatGPT e o Claude?',
    answer: 'Você faz o pedido no ChatGPT ou Claude. A Otto consulta os dados autorizados da empresa, prepara a operação e mantém permissões, confirmações e histórico no sistema de gestão.',
  },
  {
    question: 'ChatGPT ou Claude podem alterar dados sem minha autorização?',
    answer: 'Não nas ações sensíveis. A Otto aplica as permissões do usuário e solicita confirmação antes de concluir operações que alteram dados importantes da empresa.',
  },
  {
    question: 'Quais dados ficam disponíveis no ChatGPT e no Claude?',
    answer: 'Somente o contexto necessário para a solicitação e permitido para o usuário autenticado. Os dados continuam separados por empresa e controlados pela Otto.',
  },
  {
    question: 'Posso usar a Otto sem ChatGPT ou Claude?',
    answer: 'Sim. O sistema funciona integralmente pela aplicação web. ChatGPT e Claude são interfaces conectadas para consultas e preparação de rotinas.',
  },
  {
    question: 'Como meus dados são protegidos?',
    answer: 'O acesso é autenticado, os dados são isolados por empresa e as operações importantes mantêm histórico de autoria e alteração.',
  },
  {
    question: 'Como funciona a implantação?',
    answer: 'A configuração inicial organiza a empresa, os cadastros e as primeiras rotinas. Depois, a Otto conecta o contexto autorizado ao ChatGPT e ao Claude e novas integrações podem ser adicionadas progressivamente.',
  },
]
