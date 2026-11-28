/*! Otto Analytics — https://ottogestao.com.br
 * <script async src="https://ottogestao.com.br/otto.js" data-key="otto_…"></script>
 * otto.track('evento', { … }) · otto.identify('usuario-id') · otto.consent(true) · otto.reset()
 * otto.flag('chave') → true/false/'variante' · otto.onFlags(function (flags) { … })
 * Cliques, rolagem e (se o site ligar) a gravação da sessão são automáticos; data-otto-ignore num elemento o deixa de fora
 * e data-otto-mask esconde o texto dele na gravação. Campos de senha e cartão nunca são gravados.
 * Sem IP, respeita "não rastrear". Com data-consent="required", o visitante só ganha um id guardado depois de otto.consent(true).
 */
(function () {
  'use strict'
  var w = window, d = document, n = navigator
  if (w.otto && w.otto.__loaded) return
  var script = d.currentScript || d.querySelector('script[data-key][src*="otto.js"]')
  var key = script && script.getAttribute('data-key')
  if (!key) return
  var base = script.getAttribute('data-api') || new URL(script.src).origin
  var endpoint = base + '/api/analytics/eventos'
  var needConsent = script.getAttribute('data-consent') === 'required'
  var dnt = n.doNotTrack === '1' || w.doNotTrack === '1' || n.globalPrivacyControl === true
  var queue = [], timer = null, memoryId = null, userId = null

  var store = {
    get: function (k) { try { return localStorage.getItem(k) } catch (_e) { return null } },
    set: function (k, v) { try { localStorage.setItem(k, v) } catch (_e) { /* bloqueado */ } },
    del: function (k) { try { localStorage.removeItem(k) } catch (_e) { /* bloqueado */ } }
  }
  var uuid = function () { return (w.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2) }
  var consented = function () { return !needConsent || store.get('otto_consent') === '1' }

  // Visitor id: kept in this browser only after consent (when the site asks for it); otherwise lives for the page only.
  function visitor() {
    if (!consented()) return memoryId || (memoryId = uuid())
    var id = store.get('otto_id')
    if (!id) { id = memoryId || uuid(); store.set('otto_id', id) }
    return id
  }
  // Session: ends after 30 minutes without activity.
  function session() {
    var now = Date.now(), raw = null
    try { raw = sessionStorage.getItem('otto_session') } catch (_e) { /* bloqueado */ }
    var s = raw ? raw.split(':') : null
    var id = s && now - Number(s[1]) < 1800000 ? s[0] : uuid()
    try { sessionStorage.setItem('otto_session', id + ':' + now) } catch (_e) { /* bloqueado */ }
    return id
  }

  function flush(beacon) {
    if (!queue.length) return
    var body = JSON.stringify({ k: key, events: queue.splice(0, 50) })
    if (beacon && n.sendBeacon && n.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }))) return
    try { fetch(endpoint, { method: 'POST', body: body, keepalive: true, headers: { 'content-type': 'text/plain' }, credentials: 'omit' }) } catch (_e) { /* offline */ }
    if (queue.length) flush(beacon)
  }

  function track(event, props, at) {
    if (dnt || !event) return
    queue.push({
      e: String(event).slice(0, 120), t: new Date().toISOString(), d: visitor(), u: userId || store.get('otto_user') || undefined, s: session(),
      url: at || location.href, title: at ? undefined : d.title, ref: d.referrer || undefined, sw: w.screen ? screen.width : undefined, lang: n.language,
      p: props && typeof props === 'object' ? props : undefined
    })
    // Page views and clicks go out at once (a click may be about to leave the page); the rest in small batches.
    if (queue.length >= 10 || event === '$pageview' || event === '$autocapture' || event === '$rageclick') { clearTimeout(timer); flush(event !== '$pageview') }
    else { clearTimeout(timer); timer = setTimeout(function () { flush(false) }, 2000) }
  }

  var lastPath = null
  function pageview() {
    if (location.href === lastPath) return
    pageleave()
    maxScroll = 0; left = false
    lastPath = location.href
    track('$pageview')
  }
  // Single-page apps (Next.js and others) change the address without reloading.
  ;['pushState', 'replaceState'].forEach(function (m) {
    var original = history[m]
    history[m] = function () { var r = original.apply(this, arguments); setTimeout(pageview, 0); return r }
  })
  w.addEventListener('popstate', pageview)
  w.addEventListener('pagehide', function () { pageleave(); flush(true) })
  d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') flush(true) })

  // ---------- cliques e rolagem (autocaptura) ----------
  var config = null, flags = {}, flagsReady = false, flagWaiters = [], exposed = {}
  var maxScroll = 0
  function scrollPct() {
    var h = Math.max(d.documentElement.scrollHeight, d.body ? d.body.scrollHeight : 0)
    var seen = (w.scrollY || d.documentElement.scrollTop) + w.innerHeight
    return h ? Math.min(100, Math.round(seen / h * 100)) : 100
  }
  w.addEventListener('scroll', function () { var p = scrollPct(); if (p > maxScroll) maxScroll = p }, { passive: true })
  var left = false
  function pageleave() {
    if (left || !lastPath || !config || !config.autocaptura) return
    left = true
    track('$pageleave', { rolagem: lastPath === location.href ? Math.max(maxScroll, scrollPct()) : maxScroll }, lastPath)
  }
  function selector(el) {
    var parts = []
    for (var i = 0; el && el.nodeType === 1 && i < 4; i++, el = el.parentElement) {
      var p = el.tagName.toLowerCase()
      if (el.id && /^[A-Za-z][\w-]{0,40}$/.test(el.id)) { parts.unshift(p + '#' + el.id); break }
      var c = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).filter(function (x) { return x && /^[A-Za-z][\w-]{0,30}$/.test(x) }).slice(0, 2)
      parts.unshift(p + (c.length ? '.' + c.join('.') : ''))
    }
    return parts.join(' > ').slice(0, 300)
  }
  var clicks = []
  d.addEventListener('click', function (ev) {
    if (!config || !config.autocaptura || dnt) return
    var t = ev.target && ev.target.closest ? ev.target.closest('a,button,input,select,textarea,label,[role=button],[data-otto]') || ev.target : null
    if (!t || !t.tagName || (t.closest && t.closest('[data-otto-ignore]'))) return
    var tag = t.tagName.toLowerCase(), sensitive = tag === 'input' && /password|email|tel|number/.test(t.type || '')
    var text = sensitive || tag === 'input' || tag === 'textarea' ? '' : (t.innerText || t.value || t.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80)
    var docH = Math.max(d.documentElement.scrollHeight, d.body ? d.body.scrollHeight : 0)
    var props = { x: Math.round(ev.pageX / Math.max(1, d.documentElement.clientWidth) * 1000) / 1000, y: Math.round(ev.pageY), vw: w.innerWidth, dh: docH, seletor: selector(t), texto: text, tag: tag }
    if (t.getAttribute('href')) props.link = String(t.getAttribute('href')).slice(0, 300)
    var now = Date.now()
    clicks = clicks.filter(function (c) { return now - c.t < 1000 && Math.abs(c.x - ev.clientX) < 30 && Math.abs(c.y - ev.clientY) < 30 })
    clicks.push({ t: now, x: ev.clientX, y: ev.clientY })
    track(clicks.length === 3 ? '$rageclick' : '$autocapture', props)
  }, true)

  // ---------- feature flags ----------
  function applyFlags(f) {
    flags = f || {}; flagsReady = true
    var list = flagWaiters.splice(0); list.forEach(function (cb) { try { cb(flags) } catch (_e) { /* do site */ } })
  }
  function decide() {
    var body = JSON.stringify({ k: key, d: visitor(), u: userId || store.get('otto_user') || undefined, url: location.href, lang: n.language })
    fetch(base + '/api/analytics/decidir', { method: 'POST', body: body, headers: { 'content-type': 'text/plain' }, credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null })
      .then(function (r) { if (!r) { applyFlags({}); return } config = r; applyFlags(r.flags); maybeRecord(r.gravacao) })
      .catch(function () { applyFlags({}) })
  }

  // ---------- gravação da sessão (rrweb) ----------
  var recording = false
  function hash(text) { var h = 0; for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0; return Math.abs(h) % 100 }
  function maybeRecord(g) {
    if (recording || dnt || !g || !g.amostra || !consented() || hash(session()) >= g.amostra) return
    recording = true
    var tag = d.createElement('script')
    tag.src = base + '/otto-replay.js'; tag.async = true
    tag.onload = function () { startRecording(g) }
    d.head.appendChild(tag)
  }
  function startRecording(g) {
    var rr = w.rrwebRecord && (w.rrwebRecord.record || w.rrwebRecord)
    if (typeof rr !== 'function') return
    var buffer = [], seq = 0, sid = session(), size = 0
    var send = function (beacon) {
      if (!buffer.length) return
      var body = JSON.stringify({ k: key, d: visitor(), s: sid, seq: seq++, url: location.href, eventos: buffer.splice(0) })
      size = 0
      if (body.length > 1000000) return
      if (beacon && n.sendBeacon && body.length < 60000 && n.sendBeacon(base + '/api/analytics/gravacoes', new Blob([body], { type: 'text/plain' }))) return
      try { fetch(base + '/api/analytics/gravacoes', { method: 'POST', body: body, keepalive: body.length < 60000, headers: { 'content-type': 'text/plain' }, credentials: 'omit' }) } catch (_e) { /* offline */ }
    }
    try {
      rr({
        emit: function (e) { buffer.push(e); size += 1; if (size >= 200) send(false) },
        maskAllInputs: true, maskTextSelector: g.mascarar ? '*' : '[data-otto-mask]', blockSelector: '[data-otto-ignore]',
        maskInputOptions: { password: true, email: true, tel: true }, sampling: { mousemove: 50, scroll: 150, input: 'last' }, recordCanvas: false, collectFonts: false
      })
    } catch (_e) { return }
    setInterval(function () { send(false) }, 5000)
    w.addEventListener('pagehide', function () { send(true) })
    d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') send(true) })
  }

  var api = {
    __loaded: true,
    /** O valor da flag para este visitante (false enquanto as flags não chegaram; use onFlags para esperar). */
    flag: function (k) {
      var v = flags[k]
      if (flagsReady && !exposed[k]) { exposed[k] = true; track('$flag', { flag: k, variante: v === undefined ? 'false' : String(v) }) }
      return v === undefined ? false : v
    },
    /** Chama de volta quando as flags chegarem (na hora, se já chegaram). */
    onFlags: function (cb) { if (typeof cb !== 'function') return; if (flagsReady) cb(flags); else flagWaiters.push(cb) },
    track: track,
    /** Links this visitor to a signed-in user, so visits before and after signing up count as one person. */
    identify: function (id, traits) { if (!id) return; userId = String(id); if (consented()) store.set('otto_user', userId); track('$identify', traits) },
    /** The visitor's answer to the cookie banner. */
    consent: function (granted) {
      if (granted) { store.set('otto_consent', '1'); visitor(); if (config) maybeRecord(config.gravacao) }
      else { store.set('otto_consent', '0'); store.del('otto_id'); store.del('otto_user') }
    },
    /** Signing out: the next visits start as a new visitor. */
    reset: function () { userId = null; memoryId = null; store.del('otto_id'); store.del('otto_user') }
  }
  // Calls made before the script loaded (window.otto = window.otto || [] ; otto.push(['track', …])).
  var early = Array.isArray(w.otto) ? w.otto : []
  w.otto = api
  early.forEach(function (c) { if (c && api[c[0]]) api[c[0]].apply(null, c.slice(1)) })
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', pageview)
  else pageview()
  if (!dnt) decide(); else applyFlags({})
})()
