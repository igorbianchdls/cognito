// Variáveis padronizadas do host MCP Apps (hostContext.styles.variables), com alternativas
// para hosts que não as enviam. Sem fundo próprio nem fontes customizadas: o card herda o tema
// do Claude ou do ChatGPT. Botão principal neutro (texto do tema invertido), como os do próprio host.
export const cardStyles=String.raw`
:root{color-scheme:light dark;
--ink:var(--color-text-primary,light-dark(#1d1f23,#ececec));--muted:var(--color-text-secondary,light-dark(#5f6670,#a3abb4));
--faint:var(--color-text-tertiary,light-dark(#8a919a,#7d858e));
--line:var(--color-border-primary,light-dark(#e6e8eb,#34383d));--line-soft:light-dark(#eff1f3,#2b2f33);
--soft:var(--color-background-secondary,light-dark(#f6f7f8,#232629));--surface:var(--color-background-primary,light-dark(#ffffff,#1a1c1f));
--danger:var(--color-text-danger,light-dark(#b42318,#ff8a80));--warning:var(--color-text-warning,light-dark(#a15c07,#f5b54a));
--success:var(--color-text-success,light-dark(#067647,#5fd39a));--info:var(--color-text-info,light-dark(#2d5bd7,#8ab4ff));
--action:var(--ink);--on-action:var(--surface);
--radius:var(--border-radius-md,10px);--radius-sm:var(--border-radius-sm,7px);
--font:var(--font-sans,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);--mono:var(--font-mono,ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace);
--fs-xs:var(--font-text-xs-size,12px);--fs-sm:var(--font-text-sm-size,13.5px);--fs-md:var(--font-text-md-size,15px);--fs-lg:var(--font-heading-sm-size,17px);
--w-med:var(--font-weight-medium,500);--w-semi:var(--font-weight-semibold,600)}
*{box-sizing:border-box}
body{margin:0;padding:calc(4px + var(--safe-top,0px)) calc(2px + var(--safe-right,0px)) calc(4px + var(--safe-bottom,0px)) calc(2px + var(--safe-left,0px));
 font:var(--fs-sm)/1.5 var(--font);color:var(--ink);background:transparent;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
main{max-width:960px;margin:auto}
#app>*:first-child{margin-top:0}
h1{font-size:var(--fs-md);font-weight:var(--w-semi);line-height:1.3;margin:0 0 2px;letter-spacing:-.005em}
h2{font-size:var(--fs-xs);font-weight:var(--w-semi);color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin:18px 0 8px}
.sub,.muted,caption{color:var(--muted);font-size:var(--fs-xs)}
.sub{margin:2px 0 0}
caption{text-align:left;padding:0 0 6px;font-weight:var(--w-semi);text-transform:uppercase;letter-spacing:.04em;font-size:11.5px}

/* Cabeçalho: identificação, pessoa, valor em destaque e situação. */
.hero{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:2px 0 12px;border-bottom:1px solid var(--line-soft)}
.hero-main{min-width:0}.hero-side{text-align:right;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.eyebrow{font-size:var(--fs-xs);font-weight:var(--w-semi);color:var(--muted);margin:0 0 3px}
.hero h1{font-size:var(--fs-lg);margin:0;overflow-wrap:anywhere}
.hero .meta{color:var(--muted);font-size:var(--fs-xs);margin-top:3px}
.amount{font-size:22px;font-weight:var(--w-semi);line-height:1.1;letter-spacing:-.01em;white-space:nowrap}
.amount-label{font-size:var(--fs-xs);color:var(--muted)}

/* Seções e campos: rótulo pequeno em cima, valor embaixo, em grade. */
.section{margin-top:14px}.section>h2{margin:0 0 8px}
.kv{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px 18px;margin:0}
.kv>div{min-width:0}.kv dt{font-size:var(--fs-xs);color:var(--muted);margin:0 0 1px}.kv dd{margin:0;font-weight:var(--w-med);overflow-wrap:anywhere}
.kv .strong dd{font-size:var(--fs-md);font-weight:var(--w-semi)}
.kv .wide{grid-column:1/-1}
.mono{font-family:var(--mono);font-size:12.5px;letter-spacing:.01em}
.copy{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}
.copy button{min-height:0;padding:2px 8px;font-size:var(--fs-xs);border-radius:var(--radius-sm)}
details.tech{margin-top:14px;border-top:1px solid var(--line-soft);padding-top:10px}
details.tech summary{cursor:pointer;color:var(--muted);font-size:var(--fs-xs);font-weight:var(--w-semi);text-transform:uppercase;letter-spacing:.04em;list-style:none}
details.tech summary::-webkit-details-marker{display:none}details.tech summary::before{content:'▸ ';}details.tech[open] summary::before{content:'▾ '}
details.tech .kv{margin-top:10px}

/* Lista de campos antiga (cards ainda não migrados). */
.fields{display:grid;grid-template-columns:max-content 1fr;gap:6px 18px;margin:12px 0}
.fields dt{color:var(--muted)}.fields dd{margin:0;font-weight:var(--w-med);overflow-wrap:anywhere}

.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}
.metric{padding:10px 12px;border:1px solid color-mix(in srgb,var(--line) 55%,transparent);border-radius:var(--radius);background:var(--surface)}
.metric span{display:block;color:var(--muted);font-size:var(--fs-xs)}
.metric strong{display:block;font-size:var(--fs-md);font-weight:var(--w-semi);margin-top:2px}
.metric.emphasis{border-color:var(--ink)}

table{width:100%;border-collapse:collapse;margin:6px 0}.kv+table,section+table,table:has(caption){margin-top:16px}
th,td{text-align:left;padding:8px 8px;border-bottom:1px solid var(--line-soft);vertical-align:top}
th{color:var(--muted);font-weight:var(--w-med);font-size:var(--fs-xs);border-bottom-color:var(--line)}
tbody tr:last-child td{border-bottom:0}
td.num,th.num{text-align:right;white-space:nowrap}td.strong-cell{font-weight:var(--w-semi)}
tr.total td{font-weight:var(--w-semi);border-top:1px solid var(--line)}
.changed{font-weight:var(--w-semi)}.old{color:var(--muted);text-decoration:line-through}

/* Etiquetas de situação: ponto colorido + texto (a cor nunca é a única pista). */
.chip,.pill{display:inline-flex;align-items:center;gap:6px;padding:2px 9px;border-radius:var(--border-radius-full,999px);font-size:var(--fs-xs);font-weight:var(--w-med);white-space:nowrap;background:var(--soft);color:var(--ink)}
.chip::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.9}
.chip-danger{color:var(--danger);background:color-mix(in srgb,var(--danger) 11%,transparent)}
.chip-success{color:var(--success);background:color-mix(in srgb,var(--success) 12%,transparent)}
.chip-warning{color:var(--warning);background:color-mix(in srgb,var(--warning) 14%,transparent)}
.chip-info{color:var(--info);background:color-mix(in srgb,var(--info) 10%,transparent)}
.chip-muted{color:var(--muted);background:var(--soft)}

/* Avisos: faixa lateral colorida sobre fundo suave. */
.notice{margin:12px 0;padding:9px 12px;border-radius:var(--radius-sm);background:var(--soft);border-left:3px solid var(--faint);font-size:var(--fs-sm)}
.notice-danger{color:var(--danger);border-left-color:var(--danger);background:color-mix(in srgb,var(--danger) 8%,transparent)}
.notice-success{color:var(--success);border-left-color:var(--success);background:color-mix(in srgb,var(--success) 9%,transparent);font-weight:var(--w-med)}
.notice-warning{color:var(--warning);border-left-color:var(--warning);background:color-mix(in srgb,var(--warning) 10%,transparent)}
.notice-info{border-left-color:var(--info)}
.notice.slim{padding:5px 10px;font-size:var(--fs-xs);margin:10px 0}

.actions,.toolbar,.pager{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:14px 0 2px}
button,input,select{font:inherit;color:var(--ink);border:1px solid color-mix(in srgb,var(--line) 70%,transparent);border-radius:var(--radius-sm);padding:7px 14px;background:var(--surface)}
button{cursor:pointer;font-weight:var(--w-med);transition:background .12s,border-color .12s}
button:hover{background:var(--soft)}
button.primary{background:var(--action);border-color:var(--action);color:var(--on-action)}
button.primary:hover{background:color-mix(in srgb,var(--action) 86%,var(--surface))}
button:disabled{opacity:.45;cursor:default}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--color-ring-primary,var(--info));outline-offset:2px}
input.cell{width:6.5em;padding:4px 6px;text-align:right}
.choice{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line-soft)}

.bars{display:grid;gap:7px;margin:8px 0}.bar{display:grid;grid-template-columns:70px 1fr 110px;gap:10px;align-items:center}
.bar i{display:block;height:8px;border-radius:4px;background:var(--ink)}.bar b{text-align:right;font-weight:var(--w-med)}
.bar .track{display:flex;height:8px;border-radius:4px;background:var(--soft);overflow:hidden}.bar .track i{height:8px;border-radius:0}.bar i.in{background:var(--success)}.bar i.out{background:var(--danger)}
.flow{padding:8px 0;border-bottom:1px solid var(--line-soft)}.flow strong{display:block;margin-bottom:4px}
.band-a_vencer{background:var(--faint)}.band-vencido_1_30{background:#e8a33d}.band-vencido_31_60{background:#e07b39}.band-vencido_61_90{background:#d4553b}.band-vencido_mais_90{background:var(--danger)}
button.metric{text-align:left;cursor:pointer;font:inherit;color:inherit}button.metric:hover{background:var(--soft)}.metric.alert strong{color:var(--danger)}

tr.overdue td:first-child{box-shadow:inset 3px 0 0 var(--danger)}.due{color:var(--danger);font-weight:var(--w-med)}small.due,small.soon{font-size:var(--fs-xs)}.soon{color:var(--warning);font-weight:var(--w-med)}
.list .narrow{display:none;list-style:none;margin:6px 0;padding:0}
.item{padding:11px 2px;border-bottom:1px solid var(--line-soft)}.item:last-child{border-bottom:0}.item.overdue{box-shadow:inset 3px 0 0 var(--danger);padding-left:10px}
.item-top,.item-bottom{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.item-bottom{margin-top:3px;font-size:var(--fs-xs);align-items:center}
.item-title{font-weight:var(--w-semi);overflow-wrap:anywhere}.item-amount{white-space:nowrap;font-weight:var(--w-semi)}
.clickable{cursor:pointer;border-radius:var(--radius-sm)}.clickable:hover{background:var(--soft)}.clickable:focus-visible{outline:2px solid var(--color-ring-primary,var(--info));outline-offset:-2px}
.nav{margin:0 0 8px}.nav button{border:0;padding:4px 0;color:var(--muted);background:transparent}.more button{border:0;padding:4px 0;color:var(--ink);font-weight:var(--w-semi);background:transparent;text-decoration:underline;text-underline-offset:3px}
.toolbar label{display:flex;flex-direction:column;gap:4px;font-size:var(--fs-xs);color:var(--muted)}
.skeleton{display:grid;gap:10px;padding:6px 0}.skeleton-line{height:14px;border-radius:6px;background:var(--soft);animation:pulse 1.2s ease-in-out infinite}.skeleton-line:first-child{width:40%;height:18px}
@keyframes pulse{50%{opacity:.5}}@media (prefers-reduced-motion:reduce){.skeleton-line{animation:none}button{transition:none}}
#app.loading{opacity:.6}
.choices .choice:last-child{border-bottom:0}
.list.compact .wide{display:none}.list.compact .narrow{display:block}
.segmented{display:flex;flex-wrap:wrap;gap:4px}.segmented button[aria-pressed=true]{background:var(--soft);border-color:var(--ink);font-weight:var(--w-semi)}
.host-claude button,.host-claude input,.host-claude .clickable{min-height:44px}
.host-claude .copy button{min-height:32px}
@media(max-width:560px){.list .wide{display:none}.list .narrow{display:block}
 .fields{grid-template-columns:1fr}.fields dt{margin-top:6px}.bar{grid-template-columns:56px 1fr 90px}
 th,td{padding:7px 4px}.actions button{flex:1}.hide-sm{display:none}
 .hero{flex-direction:column;gap:8px}.hero-side{flex-direction:row;align-items:center;justify-content:space-between;width:100%;text-align:left}}
`
