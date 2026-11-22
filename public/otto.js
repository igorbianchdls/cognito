/*! Otto Analytics — https://ottogestao.com.br
 * <script async src="https://ottogestao.com.br/otto.js" data-key="otto_…"></script>
 * otto.track('evento', { … }) · otto.identify('usuario-id') · otto.consent(true) · otto.reset()
 * Sem IP, respeita "não rastrear". Com data-consent="required", o visitante só ganha um id guardado depois de otto.consent(true).
 */
(function () {
  'use strict'
  var w = window, d = document, n = navigator
  if (w.otto && w.otto.__loaded) return
  var script = d.currentScript || d.querySelector('script[data-key][src*="otto.js"]')
  var key = script && script.getAttribute('data-key')
  if (!key) return
  var endpoint = (script.getAttribute('data-api') || new URL(script.src).origin) + '/api/analytics/eventos'
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

  function track(event, props) {
    if (dnt || !event) return
    queue.push({
      e: String(event).slice(0, 120), t: new Date().toISOString(), d: visitor(), u: userId || store.get('otto_user') || undefined, s: session(),
      url: location.href, title: d.title, ref: d.referrer || undefined, sw: w.screen ? screen.width : undefined, lang: n.language,
      p: props && typeof props === 'object' ? props : undefined
    })
    if (queue.length >= 10) flush(false)
    else { clearTimeout(timer); timer = setTimeout(function () { flush(false) }, 2000) }
  }

  var lastPath = null
  function pageview() {
    if (location.href === lastPath) return
    lastPath = location.href
    track('$pageview')
  }
  // Single-page apps (Next.js and others) change the address without reloading.
  ;['pushState', 'replaceState'].forEach(function (m) {
    var original = history[m]
    history[m] = function () { var r = original.apply(this, arguments); setTimeout(pageview, 0); return r }
  })
  w.addEventListener('popstate', pageview)
  w.addEventListener('pagehide', function () { flush(true) })
  d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') flush(true) })

  var api = {
    __loaded: true,
    track: track,
    /** Links this visitor to a signed-in user, so visits before and after signing up count as one person. */
    identify: function (id, traits) { if (!id) return; userId = String(id); if (consented()) store.set('otto_user', userId); track('$identify', traits) },
    /** The visitor's answer to the cookie banner. */
    consent: function (granted) {
      if (granted) { store.set('otto_consent', '1'); visitor() }
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
})()
