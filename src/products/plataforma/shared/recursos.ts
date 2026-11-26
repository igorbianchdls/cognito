// Produtos novos que dependem de tabelas ainda não criadas no banco: ficam fora do menu até a migração ser aplicada.
// Para ligar, defina a variável na Vercel (valor "1") e publique de novo. Quem abrir o endereço direto antes disso vê
// "em preparação" (as rotas respondem 503 quando a tabela não existe).
export const RECURSOS = {
  /** Notas (migrações 20261126060000_notas_schema e 20261126070000_notas_bases). */
  notas: process.env.NEXT_PUBLIC_RECURSO_NOTAS === '1',
  /** Marketing → Vídeos (migração 20261126050000_marketing_videos). */
  videos: process.env.NEXT_PUBLIC_RECURSO_VIDEOS === '1',
}
