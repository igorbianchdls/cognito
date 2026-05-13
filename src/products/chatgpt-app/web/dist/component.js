(() => {
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

  function safeUrl(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    try {
      const url = new URL(text, window.location.origin);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return url.toString();
    } catch {
      return '';
    }
  }

  function errorState(message) {
    return '<section class="state-card state-card--error">' +
      '<h2>Erro</h2>' +
      '<p>' + escapeHtml(message || 'Nao foi possivel renderizar esta resposta.') + '</p>' +
    '</section>';
  }

  function isRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function formatValue(value) {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
      }).format(value);
    }
    if (typeof value === 'boolean') return value ? 'Sim' : 'Nao';
    return String(value);
  }

  function getToolEyebrow(data) {
    const tool = String(data.tool || 'resultado');
    if (tool === 'erp') return 'ERP';
    if (tool === 'sql' || tool === 'sql_execution') return 'SQL';
    if (tool === 'ecommerce') return 'Ecommerce';
    if (tool === 'marketing') return 'Marketing';
    return tool;
  }

  function getRows(data) {
    return Array.isArray(data.rows) ? data.rows.filter(isRecord) : [];
  }

  function getColumns(data, rows) {
    if (Array.isArray(data.columns) && data.columns.length) return data.columns.map(String);
    if (!rows.length) return [];
    return Object.keys(rows[0] || {});
  }

  function pickMetricColumns(rows, columns) {
    if (!rows.length) return [];
    const first = rows[0] || {};
    return columns
      .filter((column) => typeof first[column] === 'number' || typeof first[column] === 'string')
      .slice(0, 6);
  }

  function metricCards(rows, columns) {
    if (!rows.length || rows.length > 1) return '';
    const first = rows[0] || {};
    const metricColumns = pickMetricColumns(rows, columns);
    if (!metricColumns.length) return '';

    return '<section class="metric-grid">' +
      metricColumns.map((column) => (
        '<article class="metric-card">' +
          '<span>' + escapeHtml(column.replaceAll('_', ' ')) + '</span>' +
          '<strong>' + escapeHtml(formatValue(first[column])) + '</strong>' +
        '</article>'
      )).join('') +
    '</section>';
  }

  function simpleChart(data, rows) {
    const chart = data.chart;
    if (!chart || typeof chart !== 'object' || !rows.length) return '';
    const xField = chart.xField;
    const valueField = chart.valueField;
    if (!xField || !valueField) return '';

    const chartRows = rows
      .map((row) => ({
        label: formatValue(row[xField]),
        value: Number(row[valueField] || 0),
      }))
      .filter((row) => Number.isFinite(row.value))
      .slice(0, 10);

    if (!chartRows.length) return '';
    const max = Math.max(...chartRows.map((row) => Math.abs(row.value)), 1);

    return '<section class="result-card result-chart">' +
      '<div class="result-card__header">' +
        '<h2>Grafico</h2>' +
        '<span>' + escapeHtml(chart.yLabel || valueField) + '</span>' +
      '</div>' +
      '<div class="bar-list">' +
        chartRows.map((row) => {
          const width = Math.max(3, Math.round((Math.abs(row.value) / max) * 100));
          return '<div class="bar-row">' +
            '<span class="bar-label">' + escapeHtml(row.label) + '</span>' +
            '<div class="bar-track"><div class="bar-fill" style="width:' + width + '%"></div></div>' +
            '<span class="bar-value">' + escapeHtml(formatValue(row.value)) + '</span>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</section>';
  }

  function dataTable(rows, columns) {
    if (!rows.length) {
      return emptyState('Sem linhas', 'A tool retornou uma tabela vazia.');
    }
    if (!columns.length) return '';

    return '<section class="result-card table-card">' +
      '<div class="result-card__header">' +
        '<h2>Tabela</h2>' +
        '<span>' + rows.length + ' linha' + (rows.length === 1 ? '' : 's') + '</span>' +
      '</div>' +
      '<div class="table-scroll">' +
        '<table class="data-table">' +
          '<thead><tr>' +
            columns.map((column) => '<th>' + escapeHtml(column) + '</th>').join('') +
          '</tr></thead>' +
          '<tbody>' +
            rows.slice(0, 100).map((row) => (
              '<tr>' + columns.map((column) => '<td>' + escapeHtml(formatValue(row[column])) + '</td>').join('') + '</tr>'
            )).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</section>';
  }

  function renderAnalyticalResult(data) {
    const rows = getRows(data);
    const columns = getColumns(data, rows);
    const action = data.action ? 'Acao: ' + data.action : null;
    const description = [
      action,
      data.resource ? 'Resource: ' + data.resource : null,
      typeof data.count === 'number' ? data.count + ' registro' + (data.count === 1 ? '' : 's') : null,
    ].filter(Boolean).join(' · ');

    return header(
      getToolEyebrow(data),
      data.title || 'Resultado',
      description || 'Resultado estruturado da tool.'
    ) +
    metricCards(rows, columns) +
    simpleChart(data, rows) +
    dataTable(rows, columns);
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
    const embedUrl = safeUrl(dashboard.embed_url);
    if (embedUrl) {
      return '<section class="dashboard-preview-frame dashboard-embed-frame">' +
        '<div class="dashboard-preview-frame__bar">' +
          '<span>Preview interativo</span>' +
          '<a href="' + escapeHtml(embedUrl) + '" target="_blank" rel="noreferrer">Abrir em nova aba</a>' +
        '</div>' +
        '<iframe title="' + escapeHtml(dashboard.title || dashboard.id || dashboard.artifact_id || 'Dashboard') + '" src="' + escapeHtml(embedUrl) + '" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>' +
      '</section>';
    }

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
      return emptyState('Dashboard nao informado', 'A tool open_dashboard precisa receber um id valido.');
    }

    return header(
      'Preview',
      data.title || dashboard.title || 'Dashboard',
      dashboard.embed_url
        ? 'Dashboard completo renderizado a partir do embed seguro.'
        : 'Metadados e source retornados pela tool de leitura.'
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

    if (data.tool === 'erp' || data.tool === 'sql' || data.tool === 'sql_execution' || data.tool === 'ecommerce' || data.tool === 'marketing') {
      root.innerHTML = renderAnalyticalResult(data);
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
})();
