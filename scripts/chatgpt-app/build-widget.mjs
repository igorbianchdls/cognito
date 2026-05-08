#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const webDir = path.join(root, 'src/products/chatgpt-app/web')
const srcDir = path.join(webDir, 'src')
const distDir = path.join(webDir, 'dist')

const css = await readFile(path.join(srcDir, 'styles.css'), 'utf8')

const componentJs = String.raw`(() => {
  const state = {
    structuredContent: null,
    isError: false,
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function formatDate(value) {
    if (!value) return 'Sem data';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  function dashboardCard(dashboard, index) {
    const title = dashboard.title || 'Dashboard sem titulo';
    const version = dashboard.current_draft_version ?? dashboard.current_published_version;
    const url = dashboard.url
      ? '<a href="' + escapeHtml(dashboard.url) + '" target="_blank" rel="noreferrer">Abrir</a>'
      : '';

    return '<article class="dashboard-card" data-index="' + index + '">' +
      '<div class="dashboard-card__topline">' +
        '<span>' + escapeHtml(dashboard.status || 'draft') + '</span>' +
        '<span>' + escapeHtml(version ? 'v' + version : 'sem versao') + '</span>' +
      '</div>' +
      '<h2>' + escapeHtml(title) + '</h2>' +
      '<p>' + escapeHtml(dashboard.slug || dashboard.id || 'Sem identificador') + '</p>' +
      '<div class="dashboard-card__footer">' +
        '<span>Atualizado ' + escapeHtml(formatDate(dashboard.updated_at)) + '</span>' +
        url +
      '</div>' +
    '</article>';
  }

  function header(eyebrow, title, description) {
    return '<header class="dashboard-header">' +
      (eyebrow ? '<p class="dashboard-header__eyebrow">' + escapeHtml(eyebrow) + '</p>' : '') +
      '<h1>' + escapeHtml(title) + '</h1>' +
      (description ? '<p>' + escapeHtml(description) + '</p>' : '') +
    '</header>';
  }

  function emptyState(title, description) {
    return '<section class="state-card">' +
      '<h2>' + escapeHtml(title || 'Nada para renderizar') + '</h2>' +
      '<p>' + escapeHtml(description || 'Peca ao ChatGPT para listar ou abrir um dashboard.') + '</p>' +
    '</section>';
  }

  function errorState(message) {
    return '<section class="state-card state-card--error">' +
      '<h2>Erro</h2>' +
      '<p>' + escapeHtml(message || 'Nao foi possivel renderizar esta resposta.') + '</p>' +
    '</section>';
  }

  function renderList(data) {
    const dashboards = Array.isArray(data.dashboards) ? data.dashboards : [];
    if (dashboards.length === 0) {
      return emptyState('Nenhum dashboard encontrado', 'A tool retornou uma lista vazia de dashboards.');
    }

    const count = dashboards.length;
    return header(
      'Cognito',
      data.title || 'Dashboards',
      count + ' dashboard' + (count === 1 ? '' : 's') + ' retornado' + (count === 1 ? '' : 's') + '.'
    ) +
    '<div class="dashboard-grid">' +
      dashboards.map(dashboardCard).join('') +
    '</div>';
  }

  function renderMeta(dashboard) {
    const rows = [
      ['ID', dashboard.id || dashboard.artifact_id],
      ['Slug', dashboard.slug],
      ['Status', dashboard.status || dashboard.kind],
      ['Draft', dashboard.current_draft_version],
      ['Published', dashboard.current_published_version],
      ['Workspace', dashboard.workspace_id],
    ].filter((row) => row[1] !== undefined && row[1] !== null && row[1] !== '');

    return '<dl class="dashboard-meta">' +
      rows.map(([label, value]) => (
        '<div><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd></div>'
      )).join('') +
    '</dl>';
  }

  function renderPreviewFrame(dashboard) {
    const source = dashboard.source || '';
    return '<section class="dashboard-preview-frame">' +
      '<div class="dashboard-preview-frame__bar">' +
        '<span>Source TSX</span>' +
        '<span>' + escapeHtml(source.length.toLocaleString('pt-BR')) + ' chars</span>' +
      '</div>' +
      '<pre>' + escapeHtml(source || 'Source nao retornado para este dashboard.') + '</pre>' +
    '</section>';
  }

  function renderPreview(data) {
    const dashboard = data.dashboard;
    if (!dashboard || typeof dashboard !== 'object') {
      return emptyState('Dashboard nao informado', 'A render tool precisa receber o objeto retornado por dashboard_read.');
    }

    return header(
      'Preview',
      data.title || dashboard.title || 'Dashboard',
      'Metadados e source retornados pela tool de leitura.'
    ) + renderMeta(dashboard) + renderPreviewFrame(dashboard);
  }

  function render() {
    const root = document.getElementById('root');
    if (!root) return;

    if (state.isError) {
      root.innerHTML = errorState();
      return;
    }

    const data = state.structuredContent;
    if (!data) {
      root.innerHTML = emptyState('Aguardando dados', 'O widget esta pronto para receber structuredContent da tool.');
      return;
    }

    if (data.view === 'dashboard_list') {
      root.innerHTML = renderList(data);
      return;
    }

    if (data.view === 'dashboard_preview') {
      root.innerHTML = renderPreview(data);
      return;
    }

    root.innerHTML = emptyState('Formato nao reconhecido', 'A resposta da tool nao informou uma view renderizavel.');
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0') return;

    if (message.method === 'ui/notifications/tool-result') {
      const result = message.params || {};
      state.structuredContent = result.structuredContent || null;
      state.isError = Boolean(result.isError);
      render();
    }
  });

  window.addEventListener('openai:set_globals', (event) => {
    const globals = event.detail && event.detail.globals;
    if (globals && globals.toolOutput !== undefined) {
      state.structuredContent = globals.toolOutput || null;
      state.isError = false;
      render();
    }
  }, { passive: true });

  window.CognitoChatGptApp = {
    callTool(name, args = {}) {
      if (window.openai && typeof window.openai.callTool === 'function') {
        return window.openai.callTool(name, args);
      }

      window.parent.postMessage({
        jsonrpc: '2.0',
        id: 'cognito-widget-' + Date.now(),
        method: 'tools/call',
        params: { name, arguments: args },
      }, '*');

      return Promise.resolve(null);
    },
    renderToolResult(result) {
      state.structuredContent = result?.structuredContent || result || null;
      state.isError = Boolean(result?.isError);
      render();
    },
  };

  if (window.openai && window.openai.toolOutput) {
    state.structuredContent = window.openai.toolOutput;
  }

  render();
})();`

const widgetHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cognito Dashboards</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <main id="root" class="app-shell"></main>
    <script>
${componentJs}
    </script>
  </body>
</html>
`

await mkdir(distDir, { recursive: true })
await writeFile(path.join(distDir, 'component.js'), componentJs + '\n')
await writeFile(path.join(distDir, 'widget.html'), widgetHtml)

console.log('Built ChatGPT App widget:')
console.log(`- ${path.relative(root, path.join(distDir, 'component.js'))}`)
console.log(`- ${path.relative(root, path.join(distDir, 'widget.html'))}`)
