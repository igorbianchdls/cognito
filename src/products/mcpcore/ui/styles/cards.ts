// Variáveis padronizadas do host MCP Apps (hostContext.styles.variables), com alternativas
// para hosts que não as enviam. Sem fundo próprio nem fontes customizadas; a marca aparece
// apenas no botão principal.
export const cardStyles=String.raw`
:root{color-scheme:light dark;
--ink:var(--color-text-primary,light-dark(#1f2328,#ececec));--muted:var(--color-text-secondary,light-dark(#5d6670,#a8b0b8));
--line:var(--color-border-primary,light-dark(#e3e6ea,#3a3f45));--soft:var(--color-background-secondary,light-dark(#f6f7f8,#24272b));
--danger:var(--color-text-danger,light-dark(#b42318,#ff8a80));--warning:var(--color-text-warning,light-dark(#b54708,#fdb022));--success:var(--color-text-success,light-dark(#067647,#6ce9a6));
--brand:#345CE6;--radius:var(--border-radius-md,10px);--font:var(--font-sans,system-ui,-apple-system,"Segoe UI",sans-serif)}
*{box-sizing:border-box}
body{margin:0;padding:calc(4px + var(--safe-top,0px)) calc(2px + var(--safe-right,0px)) calc(4px + var(--safe-bottom,0px)) calc(2px + var(--safe-left,0px));font:var(--font-text-sm-size,14px)/1.45 var(--font);color:var(--ink);background:transparent}
main{max-width:960px;margin:auto}
h1{font-size:var(--font-heading-sm-size,17px);font-weight:var(--font-weight-semibold,600);margin:0 0 2px}
h2{font-size:var(--font-text-md-size,15px);font-weight:var(--font-weight-semibold,600);margin:16px 0 8px}
.sub,.muted,caption{color:var(--muted);font-size:var(--font-text-xs-size,12.5px)}
caption{text-align:left;padding:0 0 6px}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}
.metric{padding:10px 12px;border:1px solid var(--line);border-radius:var(--radius)}
.metric span{display:block;color:var(--muted);font-size:var(--font-text-xs-size,12.5px)}
.metric strong{display:block;font-size:var(--font-heading-xs-size,16px);margin-top:2px}
table{width:100%;border-collapse:collapse;margin:4px 0}
th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--muted);font-weight:var(--font-weight-medium,500);font-size:var(--font-text-xs-size,12.5px)}
td.num,th.num{text-align:right;white-space:nowrap}
tr.total td{font-weight:var(--font-weight-semibold,600);border-bottom:0}
.fields{display:grid;grid-template-columns:max-content 1fr;gap:4px 14px;margin:10px 0}
.fields dt{color:var(--muted)}.fields dd{margin:0}
.changed{font-weight:var(--font-weight-semibold,600)}.old{color:var(--muted);text-decoration:line-through}
.pill{display:inline-block;padding:1px 8px;border:1px solid var(--line);border-radius:var(--border-radius-full,999px);font-size:var(--font-text-xs-size,12px)}
.notice{margin:10px 0;padding:8px 10px;border-radius:var(--radius);background:var(--soft)}
.notice-danger{color:var(--danger)}.notice-success{color:var(--success)}
.actions,.toolbar,.pager{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0 2px}
.bars{display:grid;gap:6px;margin:8px 0}.bar{display:grid;grid-template-columns:70px 1fr 110px;gap:8px;align-items:center}
.bar i{display:block;height:8px;border-radius:4px;background:var(--brand)}.bar b{text-align:right;font-weight:var(--font-weight-medium,500)}
button,input,select{font:inherit;color:var(--ink);border:1px solid var(--line);border-radius:var(--radius);padding:7px 12px;background:transparent}
button{cursor:pointer;font-weight:var(--font-weight-medium,500)}
button.primary{background:var(--brand);border-color:var(--brand);color:#fff}
button:disabled{opacity:.5;cursor:default}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--color-ring-primary,var(--brand));outline-offset:2px}
input.cell{width:6.5em;padding:4px 6px;text-align:right}
.choice{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}
@media(max-width:560px){.fields{grid-template-columns:1fr}.fields dt{margin-top:6px}.bar{grid-template-columns:56px 1fr 90px}
 th,td{padding:6px 4px}.actions button{flex:1}.hide-sm{display:none}}

.chip{display:inline-block;padding:1px 8px;border-radius:var(--border-radius-full,999px);font-size:var(--font-text-xs-size,12px);font-weight:var(--font-weight-medium,500);border:1px solid transparent}
.chip-danger{color:var(--danger);background:color-mix(in srgb,var(--danger) 12%,transparent)}.chip-success{color:var(--success);background:color-mix(in srgb,var(--success) 12%,transparent)}
.chip-warning{color:var(--warning);background:color-mix(in srgb,var(--warning) 14%,transparent)}.chip-info{color:var(--ink);background:var(--soft)}.chip-muted{color:var(--muted);border-color:var(--line)}
tr.overdue td:first-child{box-shadow:inset 3px 0 0 var(--danger)}.due{color:var(--danger);font-weight:var(--font-weight-medium,500)}small.due,small.soon{font-size:var(--font-text-xs-size,12px)}.soon{color:var(--warning);font-weight:var(--font-weight-medium,500)}
.list .narrow{display:none;list-style:none;margin:4px 0;padding:0}
.item{padding:10px 2px;border-bottom:1px solid var(--line)}.item.overdue{box-shadow:inset 3px 0 0 var(--danger);padding-left:10px}
.item-top,.item-bottom{display:flex;justify-content:space-between;gap:10px;align-items:baseline}.item-bottom{margin-top:3px;font-size:var(--font-text-xs-size,12.5px)}
.item-title{font-weight:var(--font-weight-medium,500);overflow-wrap:anywhere}.item-amount{white-space:nowrap}
.clickable{cursor:pointer}.clickable:hover{background:var(--soft)}.clickable:focus-visible{outline:2px solid var(--color-ring-primary,var(--brand));outline-offset:-2px}
.nav{margin:0 0 6px}.nav button{border:0;padding:4px 0;color:var(--muted)}.more button{border:0;padding:4px 0;color:var(--brand);font-weight:var(--font-weight-medium,500)}
.toolbar label{display:flex;flex-direction:column;gap:4px;font-size:var(--font-text-xs-size,12px);color:var(--muted)}
.skeleton{display:grid;gap:10px;padding:6px 0}.skeleton-line{height:14px;border-radius:6px;background:var(--soft);animation:pulse 1.2s ease-in-out infinite}.skeleton-line:first-child{width:40%;height:18px}
@keyframes pulse{50%{opacity:.5}}@media (prefers-reduced-motion:reduce){.skeleton-line{animation:none}}
#app.loading{opacity:.6}
.bar .track{display:flex;height:8px;border-radius:4px;background:var(--soft);overflow:hidden}.bar .track i{height:8px;border-radius:0}.bar i.in{background:var(--success)}.bar i.out{background:var(--danger)}
.flow{padding:6px 0;border-bottom:1px solid var(--line)}.flow strong{display:block;margin-bottom:4px}
.band-a_vencer{background:var(--muted)}.band-vencido_1_30{background:#e8a33d}.band-vencido_31_60{background:#e07b39}.band-vencido_61_90{background:#d4553b}.band-vencido_mais_90{background:var(--danger)}
button.metric{text-align:left;cursor:pointer;font:inherit;color:inherit;background:transparent}button.metric:hover{background:var(--soft)}.metric.alert strong{color:var(--danger)}
.choices .choice:last-child{border-bottom:0}
@media(max-width:560px){.list .wide{display:none}.list .narrow{display:block}}
.list.compact .wide{display:none}.list.compact .narrow{display:block}
.segmented{display:flex;flex-wrap:wrap;gap:4px}.segmented button[aria-pressed=true]{background:var(--soft);border-color:var(--ink);font-weight:var(--font-weight-semibold,600)}
.host-claude button,.host-claude input,.host-claude .clickable{min-height:44px}
`
