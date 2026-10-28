'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight, Grid2X2, Search, X } from 'lucide-react';
import s from './SystemsDirectory.module.css';

const systems = [
  { category: 'Casamentos e eventos', brand: 'Vélia', group: 'Serviços', href: '/eventos', image: '/eventos-media/hero.jpg', description: 'Casamentos e celebrações planejados do orçamento ao grande dia.', features: ['Eventos', 'Convidados', 'Fornecedores'], letter: 'V', tone: 'sand' },
  { category: 'Construtoras e reformas', brand: 'Átio', group: 'Casa e construção', href: '/obras', image: '/obras-media/hero.jpg', description: 'Obras, equipes e entregas acompanhadas em cada etapa.', features: ['Obras', 'Cronograma', 'Compras'], letter: 'A', tone: 'olive' },
  { category: 'Marcenaria e planejados', brand: 'Cerne', group: 'Casa e construção', href: '/marcenaria', image: '/marcenaria-media/hero.jpg', description: 'Do desenho aprovado ao último detalhe da montagem.', features: ['Projetos', 'Produção', 'Materiais'], letter: 'C', tone: 'wood' },
  { category: 'Assistência técnica', brand: 'Nexo', group: 'Serviços', href: '/assistencia', image: '/assistencia-media/hero.jpg', description: 'Cada aparelho, diagnóstico e reparo no lugar certo.', features: ['Ordens de serviço', 'Peças', 'Garantias'], letter: 'N', tone: 'stone' },
  { category: 'Loja de roupas', brand: 'Alma', group: 'Comércio', href: '/roupas', image: '/roupas-media/hero.jpg', description: 'Coleções, vendas e estoque em perfeita sintonia.', features: ['Vendas', 'Tamanhos e cores', 'Trocas'], letter: 'A', tone: 'linen' },
  { category: 'Oficina automotiva', brand: 'Torque', group: 'Serviços', href: '/oficina', image: '/oficina-media/hero.jpg', description: 'Da entrada do veículo à entrega do serviço concluído.', features: ['Ordens de serviço', 'Orçamentos', 'Peças'], letter: 'T', tone: 'graphite' },
  { category: 'Hotel e pousada', brand: 'Lumen', group: 'Serviços', href: '/hotel', image: '/hotel-media/hero.jpg', description: 'Reservas, hóspedes e quartos sob controle, do check-in ao check-out.', features: ['Reservas', 'Quartos', 'Governança'], letter: 'L', tone: 'sand' },
  { category: 'Salão de beleza', brand: 'Aura', group: 'Serviços', href: '/salao', image: '/salao-media/hero.jpg', description: 'Agenda, profissionais e comissões com cuidado em cada detalhe.', features: ['Agenda', 'Profissionais', 'Comissões'], letter: 'A', tone: 'sand' },
  { category: 'Pet shop e banho e tosa', brand: 'Pata', group: 'Serviços', href: '/petshop', image: '/petshop-media/hero.jpg', description: 'Pets, tutores, produtos e atendimentos em perfeita sintonia.', features: ['Atendimentos', 'Pets e vacinas', 'Vendas'], letter: 'P', tone: 'olive' },
  { category: 'Imobiliária', brand: 'Habita', group: 'Casa e construção', href: '/imobiliaria', image: '/imobiliaria-media/hero.jpg', description: 'Imóveis, visitas e oportunidades para aproximar bons negócios.', features: ['Imóveis', 'Propostas', 'Comissões'], letter: 'H', tone: 'wood' },
  { category: 'Escola de cursos e idiomas', brand: 'Forma', group: 'Educação', href: '/cursos', image: '/cursos-media/hero.jpg', description: 'Turmas, matrículas e aprendizado acompanhados de perto.', features: ['Turmas', 'Presença', 'Mensalidades'], letter: 'F', tone: 'stone' },
  { category: 'Limpeza e manutenção', brand: 'Clara', group: 'Serviços', href: '/limpeza', image: '/limpeza-media/hero.jpg', description: 'Contratos, equipes e materiais organizados em cada execução.', features: ['Contratos', 'Escalas', 'Checklist'], letter: 'C', tone: 'linen' },
];
const groups = ['Todos', 'Serviços', 'Casa e construção', 'Comércio', 'Educação'];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function SystemsDirectory() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('Todos');
  const filtered = systems.filter(system => (group === 'Todos' || system.group === group) && normalize([system.category, system.brand, system.description, ...system.features].join(' ')).includes(normalize(query.trim())));
  return <main className={s.page}>
    <header className={s.header}>
      <Link href="/sistemas" className={s.logo} aria-label="Cognito, diretório de sistemas"><span>C.</span><div>COGNITO<small>COLEÇÃO DE SISTEMAS</small></div></Link>
      <a href="#categorias" className={s.headerLink}>Explorar categorias<ArrowDown size={14} /></a>
      <span className={s.available}><i />{systems.length} sistemas disponíveis</span>
    </header>
    <section className={s.hero} aria-labelledby="directory-title">
      <div><span className={s.eyebrow}>FEITOS PARA CADA TIPO DE NEGÓCIO</span><h1 id="directory-title">Seu negócio.<br /><em>O sistema certo.</em></h1><p>Escolha uma categoria e entre no sistema correspondente.<br className={s.desktopBreak} />Uma coleção de ferramentas para organizar cada detalhe.</p><a className={s.explore} href="#categorias">Encontre seu sistema<ArrowDown size={15} /></a></div>
      <aside className={s.heroNote}><Grid2X2 size={22} strokeWidth={1.2} /><span>Uma coleção,<br />muitas possibilidades.</span><strong>{String(systems.length).padStart(2, '0')}</strong><small>categorias para explorar</small></aside>
    </section>
    <section id="categorias" className={s.catalog} aria-label="Categorias de sistemas">
      <div className={s.catalogHeading}><div><span className={s.eyebrow}>ENCONTRE O SEU ESPAÇO</span><h2>Explore as categorias</h2></div><label className={s.search}><Search size={16} strokeWidth={1.5} /><input aria-label="Buscar categoria ou sistema" placeholder="Buscar categoria ou sistema..." value={query} onChange={e => setQuery(e.target.value)} />{query && <button type="button" aria-label="Limpar busca" onClick={() => setQuery('')}><X size={14} /></button>}</label></div>
      <div className={s.filters}><div role="group" aria-label="Filtrar por segmento">{groups.map(name => <button key={name} aria-pressed={group === name} className={group === name ? s.active : ''} onClick={() => setGroup(name)}>{name}{name === 'Todos' && <span>{systems.length}</span>}</button>)}</div><span aria-live="polite">{filtered.length} {filtered.length === 1 ? 'sistema encontrado' : 'sistemas encontrados'}</span></div>
      <div className={s.grid}>{filtered.map((system, index) => <Link href={system.href} prefetch={false} className={`${s.card} ${s[system.tone]}`} key={system.href} aria-label={`Abrir ${system.brand} — ${system.category}`}>
        <div className={s.cover}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={system.image} alt={`Ambiente de ${system.category.toLowerCase()}`} loading={index > 2 ? 'lazy' : 'eager'} />
          <div className={s.coverShade} /><span className={s.segment}>{system.group}</span><span className={s.openIcon}><ArrowUpRight size={18} strokeWidth={1.5} /></span><div className={s.brand}><span>{system.letter}</span><strong>{system.brand}</strong></div>
        </div>
        <div className={s.cardBody}><h3>{system.category}</h3><p>{system.description}</p><div className={s.features}>{system.features.map(feature => <span key={feature}>{feature}</span>)}</div><div className={s.cardFooter}><span>Abrir sistema</span><ArrowRight size={17} /></div></div>
      </Link>)}</div>
      {!filtered.length && <div className={s.empty}><Search size={28} strokeWidth={1} /><h3>Nenhum sistema encontrado</h3><p>Experimente buscar por outro nome ou categoria.</p><button onClick={() => { setGroup('Todos'); setQuery(''); }}>Mostrar todos os sistemas<ArrowRight size={14} /></button></div>}
    </section>
    <footer className={s.footer}><span>COGNITO<span className={s.footerDot}>·</span>SISTEMAS PARA NEGÓCIOS</span><p>Escolha uma categoria. Organize o próximo passo.</p><small>Versões de demonstração</small></footer>
  </main>;
}
