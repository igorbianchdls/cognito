# Aura, Habita, Forma e Clara

Frontends demonstrativos em `/salao`, `/imobiliaria`, `/cursos` e `/limpeza`, reunidos em `/sistemas`. O pet shop (`/petshop`, Pata) tem agora um app próprio em `src/assets/landingpages/petshop`. Mantêm Geist nos textos e Georgia nos títulos. Cada sistema tem dados próprios no armazenamento local, backup JSON e acesso de volta ao diretório.

Aura: clientes, serviços, agenda com validação de conflito, profissionais, comissões sobre atendimentos concluídos, repasse e financeiro.

Habita: imóveis, proprietários, corretores, visitas, oportunidades, fechamento de venda/locação e geração da comissão a receber. O valor do imóvel não entra como receita da imobiliária. Fichas de imóveis exportáveis em TXT.

Forma: cursos, turmas, capacidade, matrícula com reserva de vaga, mensalidades por mês, presença por data e conflito de professor/sala. Finalizar a turma encerra matrículas ativas. O calendário não considera feriados. Não há emissão de certificado ou cobrança externa.

Clara: contratos mensais, serviços avulsos, agenda, equipes e escalas sem sobreposição, checklist obrigatório na conclusão e consumo/devolução de materiais. Serviços sob contrato não geram cobrança por execução; a cobrança mensal é gerada na tela de contratos, uma por mês. A frequência é informativa: as execuções são agendadas na agenda.

Não há backend, autenticação individual, integração fiscal, mensagens externas, upload ou cobrança real. Os dados são fictícios e usam outubro de 2026 como período de referência. Concluir atendimentos registra receita prevista, cuja confirmação de pagamento é feita no financeiro. As operações financeiras vinculadas preservam o valor da origem.

## Imagens

Fotografias de apoio criadas com a ferramenta de geração de imagens integrada. Arquivos finais: `public/salao-media`, `public/imobiliaria-media`, `public/cursos-media`, `public/limpeza-media`.

Prompt de geração: fotografia editorial realista, luz natural quente e paleta marfim/madeira; grade 2x3 sem texto, com salão de beleza, banho e tosa de um golden retriever, apartamento contemporâneo, sala de cursos para adultos, equipe de limpeza em escritório e retrato de uma gerente brasileira. Cada cena foi extraída como imagem local. A foto secundária de imóvel reaproveita o ativo de arquitetura da demonstração Átio.
