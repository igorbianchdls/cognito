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
.commercial-card{padding:16px;min-width:0}
.commercial-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:8px}
.commercial-header h1{font-size:20px;line-height:1.3;letter-spacing:-.025em;margin:0;font-weight:var(--w-semi)}
.commercial-header p{margin:4px 0 0;font-size:13px;color:var(--muted)}
.commercial-header>svg{width:20px;height:20px;flex-shrink:0;color:var(--muted)}
.commercial-list{list-style:none;margin:0;padding:0}
.commercial-list>li{border-bottom:1px solid var(--line-soft)}
.commercial-row{display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;min-height:78px;padding:16px 0;border:0;border-radius:0;background:transparent;text-align:left;font-weight:400}
.commercial-row:hover{background:var(--soft)}
.commercial-row:focus-visible{outline-offset:2px;border-radius:8px}
.commercial-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--soft);color:var(--muted)}
.commercial-icon svg{width:19px;height:19px}
.commercial-identity,.commercial-amount{display:flex;flex-direction:column;gap:4px;min-width:0}
.commercial-identity strong,.commercial-amount strong{font-size:15px;line-height:1.4;font-weight:var(--w-med)}
.commercial-identity strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.commercial-date,.commercial-status{font-size:13px;line-height:1.4}
.commercial-date{color:var(--muted);white-space:nowrap}
.commercial-amount{align-items:flex-end;max-width:100%;text-align:right}
.commercial-amount strong{white-space:nowrap}
.commercial-status{color:var(--muted);max-width:15ch;overflow-wrap:anywhere}
.commercial-status-danger{color:var(--danger)}.commercial-status-success{color:var(--success)}.commercial-status-warning{color:var(--warning)}.commercial-status-info{color:var(--info)}
.commercial-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:20px}
.commercial-range{font-size:13px;line-height:1.4;color:var(--muted)}
.commercial-pager{display:flex;align-items:center;gap:9px;flex-shrink:0}
.commercial-pager button{display:grid;place-items:center;width:48px;height:32px;padding:0;border:1px solid var(--line);border-radius:999px;color:var(--muted);background:transparent}
.commercial-pager button:hover:not(:disabled){background:var(--soft);border-color:var(--faint)}
.commercial-pager button:disabled{opacity:.3}
.commercial-pager svg{width:18px;height:18px}
.commercial-position{font-size:15px;white-space:nowrap;color:var(--ink)}
@media(max-width:359px){.commercial-card{padding:12px}.commercial-row{grid-template-columns:32px minmax(0,1fr) auto;gap:8px}.commercial-icon{width:32px;height:36px}.commercial-pager{gap:6px}.commercial-pager button{width:40px}.commercial-footer{gap:8px}.commercial-range{font-size:12px}}
.segmented{display:flex;flex-wrap:wrap;gap:4px}.segmented button[aria-pressed=true]{background:var(--soft);border-color:var(--ink);font-weight:var(--w-semi)}
.host-claude button,.host-claude input,.host-claude .clickable{min-height:44px}
.host-claude .copy button{min-height:32px}
.creation-card{padding:18px 16px;min-width:0}
.creation-header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-bottom:20px;border-bottom:1px solid var(--line-soft)}
.creation-header h1,.creation-success h1{font-size:20px;line-height:1.3;letter-spacing:-.02em;font-weight:var(--w-semi);margin:0}
.creation-header p,.creation-success p{font-size:13px;color:var(--muted);margin:5px 0 0;overflow-wrap:anywhere}
.creation-header>svg{width:22px;height:22px;flex-shrink:0;color:var(--muted)}
.creation-block{padding:20px 0;border-bottom:1px solid var(--line-soft)}
.creation-label{font-size:13px;color:var(--muted);line-height:1.5;margin:0}
.creation-person{display:flex;gap:10px;align-items:center;margin-top:10px;min-width:0}
.creation-avatar{display:grid;place-items:center;width:38px;height:38px;flex-shrink:0;background:var(--soft);border-radius:50%;color:var(--muted)}
.creation-avatar svg{width:20px;height:20px}
.creation-person>div{display:flex;flex-direction:column;gap:3px;min-width:0}
.creation-person strong{font-size:16px;font-weight:var(--w-semi);overflow-wrap:anywhere}
.creation-section-heading,.creation-item-top{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.creation-section-heading h2{margin:0;color:var(--ink);font-size:16px;font-weight:var(--w-semi);letter-spacing:0;text-transform:none}
.creation-section-heading>.creation-label{flex-shrink:0}
.creation-items{list-style:none;padding:0;margin:14px 0 0}
.creation-items>li{padding:12px 0;border-bottom:1px solid var(--line-soft)}
.creation-items>li:first-child{padding-top:0}.creation-items>li:last-child{border-bottom:0;padding-bottom:0}
.creation-item-top>strong:first-child{font-size:15px;font-weight:var(--w-med);min-width:0;overflow-wrap:anywhere}
.creation-item-total{white-space:nowrap;font-size:16px;font-weight:var(--w-semi);flex-shrink:0}
.creation-items p{margin:3px 0 0}
.creation-terms{display:flex;justify-content:space-between;gap:16px}
.creation-terms>div{display:flex;flex-direction:column;gap:4px;min-width:0}.creation-terms>div:last-child{text-align:right}
.creation-terms strong{font-size:16px;font-weight:var(--w-semi);overflow-wrap:anywhere}
.creation-installments{margin:12px 0}.creation-installments summary{color:var(--muted);cursor:pointer;min-height:32px}
.creation-pager{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:14px;font-size:13px}
.creation-pager>.muted{margin-right:auto}.creation-pager button{display:grid;place-items:center;width:36px;min-height:36px;padding:0;border-radius:999px}
.creation-pager svg{width:16px;height:16px}
.creation-fields{margin:16px 0;display:grid;gap:12px}.creation-fields>div{display:flex;justify-content:space-between;gap:16px}
.creation-fields dt{font-size:13px;color:var(--muted);min-width:0;overflow-wrap:anywhere}.creation-fields dd{margin:0;font-weight:var(--w-med);text-align:right;min-width:0;overflow-wrap:anywhere;max-width:66%}
.creation-total{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:14px 12px;margin-top:16px;background:var(--soft);border-radius:12px}
.creation-total strong:first-child{font-size:16px;min-width:0}.creation-total strong:last-child{font-size:22px;line-height:1.2;white-space:nowrap;letter-spacing:-.025em}
.creation-actions{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.creation-actions button{display:flex;justify-content:center;align-items:center;gap:12px;width:100%;min-height:40px;border-radius:999px;padding:9px 16px;font-size:15px}
.creation-actions svg{width:18px;height:18px}
.creation-actions button:not(.primary){color:var(--muted)}
.creation-card:not(.creation-result) .creation-actions button:not(.primary){border:0;background:transparent;min-height:32px;padding:3px 12px;font-size:13px}
.creation-footnote{text-align:center;color:var(--muted);font-size:12px;margin:12px 0 0;overflow-wrap:anywhere}
.creation-item-editor{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
.creation-item-editor label{font-size:12px;color:var(--muted);min-width:0}
.creation-item-editor input.cell{display:block;width:100%;min-width:0;margin-top:4px;padding:8px}
.creation-success{text-align:center;padding:6px 0 24px}
.creation-success-icon{display:grid;place-items:center;color:var(--success);margin:0 auto 12px}.creation-success-icon svg{width:30px;height:30px}
.creation-success p{margin-top:8px}
.creation-summary{padding:14px 12px;margin:0;background:var(--soft);border-radius:12px;display:grid;gap:12px}
.creation-summary>div{display:flex;justify-content:space-between;align-items:baseline;gap:16px}
.creation-summary dt{font-size:13px;color:var(--muted)}.creation-summary dd{font-size:16px;font-weight:var(--w-semi);margin:0;max-width:68%;text-align:right;overflow-wrap:anywhere}
.creation-result .creation-actions{margin-top:12px}
.deletion-card{padding:18px 16px;min-width:0}
.deletion-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:20px;border-bottom:1px solid var(--line-soft)}
.deletion-header>div{min-width:0}.deletion-header h1,.deletion-result h1{font-size:20px;letter-spacing:-.025em;overflow-wrap:anywhere}
.deletion-header p,.deletion-result header p{margin:5px 0 0;color:var(--muted);font-size:13px}
.deletion-trash{display:grid;place-items:center;width:40px;height:40px;flex-shrink:0;border-radius:13px;background:var(--soft);color:var(--danger)}
.deletion-trash svg,.deletion-warning>svg{width:20px;height:20px}
.deletion-selected{padding:16px 0}.deletion-selected>p{margin:0 0 10px}
.deletion-identity{display:flex;align-items:center;gap:12px;min-width:0}
.deletion-record-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:var(--soft);color:var(--muted);flex-shrink:0}
.deletion-record-icon svg{width:21px;height:21px}.deletion-identity>div{min-width:0;flex:1;overflow-wrap:anywhere}.deletion-identity strong{display:block;font-size:16px;font-weight:var(--w-semi)}
.deletion-identity .creation-label{display:block;margin-top:4px}.deletion-identity .chip{flex-shrink:0;max-width:35%;overflow-wrap:anywhere}
.deletion-summary{margin-bottom:14px}.deletion-summary .deletion-summary-reason{display:block}.deletion-summary-reason dd{max-width:100%;text-align:left;margin-top:5px;font-weight:400;font-size:14px;white-space:pre-wrap}
.deletion-status{color:var(--danger)}
.deletion-reason{display:grid;gap:6px;margin-top:14px}.deletion-reason label{font-size:14px;color:var(--muted)}
.deletion-reason select,.deletion-reason textarea{width:100%;min-width:0;max-width:100%;min-height:40px;border:1px solid var(--line);border-radius:9px;padding:9px 10px;background:var(--surface);color:var(--ink);font:inherit}
.deletion-reason textarea{resize:vertical;overflow-wrap:anywhere}.deletion-reason textarea:focus-visible{outline:2px solid var(--color-ring-primary,var(--info));outline-offset:2px}
.deletion-warning{display:flex;align-items:flex-start;gap:9px;margin:16px 0;color:var(--danger);font-size:14px}.deletion-warning>svg{flex-shrink:0;margin-top:2px}
.deletion-warning strong{font-weight:var(--w-med)}.deletion-warning p{margin:2px 0 0;color:var(--muted)}
.deletion-actions{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}.deletion-actions button{display:flex;align-items:center;justify-content:center;gap:9px;flex:1;min-width:0;min-height:40px;border-radius:999px;padding:8px 12px;font-size:14px;color:var(--muted)}
.deletion-actions svg{width:18px;height:18px;flex-shrink:0}.deletion-actions .deletion-destructive{background:light-dark(#dc2626,#b91c1c);color:#fff;border-color:transparent}.deletion-actions .deletion-destructive:hover:not(:disabled){background:light-dark(#b91c1c,#991b1b)}
.deletion-result .creation-success{padding:8px 0 24px}
.edit-card{padding:18px 16px;min-width:0}
.edit-header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-bottom:20px;border-bottom:1px solid var(--line-soft)}
.edit-header>div{min-width:0}.edit-header h1,.edit-result h1{font-size:20px;letter-spacing:-.025em;overflow-wrap:anywhere}
.edit-header p,.edit-result header p{margin:5px 0 0;color:var(--muted);font-size:13px}
.edit-header-icon{display:grid;place-items:center;width:40px;height:40px;flex-shrink:0;background:var(--soft);border-radius:13px;color:var(--muted)}.edit-header-icon svg{width:22px;height:22px}
.edit-identity{display:flex;align-items:center;gap:12px;padding:20px 0;border-bottom:1px solid var(--line-soft)}.edit-identity>div{min-width:0;overflow-wrap:anywhere}.edit-identity strong{display:block;font-size:17px;font-weight:var(--w-semi)}.edit-identity p{margin:4px 0 0}
.edit-section-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:20px 0 10px}.edit-section-heading h2{font-size:16px;font-weight:var(--w-semi);color:var(--ink);text-transform:none;letter-spacing:0;margin:0}
.edit-count{padding:2px 9px;border-radius:999px;background:var(--soft);font-size:12px;white-space:nowrap}
.edit-changes{display:grid;gap:10px}.edit-change{min-width:0;padding:14px 12px;border-radius:13px;background:var(--soft);overflow-wrap:anywhere}
.edit-change h3{font-size:14px;font-weight:var(--w-med);margin:0 0 14px;color:var(--muted)}.edit-change .creation-label{margin:8px 0 4px}.edit-old{display:block;font-size:16px;color:var(--muted);white-space:pre-wrap}.edit-direction{font-size:13px;color:var(--muted);margin:14px 0}.edit-new{display:block;font-size:17px;white-space:pre-wrap;overflow-wrap:anywhere}
.edit-input{display:grid;gap:7px}.edit-input label{font-size:13px;color:var(--muted)}.edit-input input,.edit-input select,.edit-input textarea{width:100%;min-width:0;max-width:100%;min-height:40px;border:1px solid var(--line);border-radius:9px;padding:9px 10px;background:var(--surface);color:var(--ink);font:inherit;font-size:16px}
.edit-input textarea{resize:vertical}.edit-input textarea:focus-visible{outline:2px solid var(--color-ring-primary,var(--info));outline-offset:2px}.edit-input [aria-invalid=true]{border-color:var(--danger)}
.edit-input .edit-clear{justify-self:start;border:0;padding:0;background:transparent;font-size:12px;min-height:28px;color:var(--muted)}
.edit-actions{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}.edit-actions button{flex:1;min-width:0;min-height:40px;border-radius:999px;font-size:14px;padding:9px 14px}.edit-actions button:not(.primary){color:var(--muted)}
.edit-result .creation-success{padding:8px 0 22px}.edit-result .edit-section-heading{margin-top:0}.edit-result .edit-change .edit-new{margin-top:4px}
@media(max-width:359px){.edit-card{padding:14px 12px}.edit-actions{flex-direction:column}.edit-actions button{flex:auto;width:100%}}
@media(max-width:359px){.deletion-card{padding:14px 12px}.deletion-actions{flex-direction:column}.deletion-actions button{flex:auto;width:100%}.deletion-identity{gap:8px}.deletion-identity strong{font-size:15px}.deletion-summary>div{gap:10px}}
@media(max-width:359px){.creation-card{padding:14px 12px}.creation-total{gap:8px;padding:12px 10px}.creation-total strong:first-child{font-size:14px}.creation-total strong:last-child{font-size:19px}.creation-item-total{font-size:14px}.creation-item-top{gap:8px}}
@media(max-width:560px){.list .wide{display:none}.list .narrow{display:block}
 .fields{grid-template-columns:1fr}.fields dt{margin-top:6px}.bar{grid-template-columns:56px 1fr 90px}
 th,td{padding:7px 4px}.actions button{flex:1}.hide-sm{display:none}
 .hero{flex-direction:column;gap:8px}.hero-side{flex-direction:row;align-items:center;justify-content:space-between;width:100%;text-align:left}}
`
