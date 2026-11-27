// Produtos que dependeram de migração antes de aparecer no menu. As tabelas já existem no banco (migrações de
// 20261126050000 a 20261126100000 aplicadas), então ficam ligados; para esconder de novo, defina a variável na Vercel
// com o valor "0" e publique. Quem abrir o endereço direto sem as tabelas vê "em preparação" (as rotas respondem 503).
export const RECURSOS = {
  /** Notas (migrações notas_schema, notas_bases, notas_etapa3, notas_etapa4 e notas_etapa5). */
  notas: process.env.NEXT_PUBLIC_RECURSO_NOTAS !== '0',
  /** Marketing → Vídeos (migração marketing_videos). */
  videos: process.env.NEXT_PUBLIC_RECURSO_VIDEOS !== '0',
}
