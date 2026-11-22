/*! Otto Video Hosting — player de vídeos de venda
 * <script async src="https://ottogestao.com.br/videohosting.js" data-video="CODIGO"></script>
 * Autoplay mudo com aviso para ouvir (volta ao início ao ativar o som), barra de progresso acelerada, continuar de onde parou,
 * botões que aparecem num momento do vídeo, controles configuráveis. Vários players na mesma página funcionam.
 */
(function () {
  'use strict'
  var w = window, d = document
  var scripts = d.currentScript ? [d.currentScript] : [].slice.call(d.querySelectorAll('script[data-video][src*="videohosting.js"]'))
  scripts.forEach(function (s) {
    if (s.__ottoPlayer) return
    s.__ottoPlayer = true
    var code = s.getAttribute('data-video')
    if (!code) return
    var api = (s.getAttribute('data-api') || new URL(s.src).origin) + '/api/videohosting/v/' + encodeURIComponent(code)
    var host = d.createElement('div')
    host.className = 'otto-video'
    host.style.cssText = 'display:block;width:100%;max-width:' + (s.getAttribute('data-max-width') || '100%')
    s.parentNode.insertBefore(host, s)
    fetch(api, { credentials: 'omit' }).then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b } }) })
      .then(function (r) { if (r.ok) mount(host, r.body); else message(host, r.body && r.body.erro || 'Vídeo indisponível.') })
      .catch(function () { message(host, 'Não foi possível carregar o vídeo.') })
  })

  function message(host, text) {
    host.textContent = text
    host.style.cssText += ';padding:24px;text-align:center;font:14px system-ui,sans-serif;color:#666;background:#f4f4f5;border-radius:12px'
  }

  var icons = {
    sound: '<svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
    vol: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
    mute: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z"/></svg>',
    full: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    big: '<svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
  }

  function mount(host, cfg) {
    var c = cfg.configuracoes, ctl = c.controles
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host
    var ratio = cfg.largura && cfg.altura ? (cfg.altura / cfg.largura * 100) : 56.25
    root.innerHTML = '<style>' +
      ':host{all:initial;display:block}*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}' +
      '.box{position:relative;width:100%;padding-top:' + ratio + '%;background:#000;overflow:hidden;border-radius:' + c.arredondamento + 'px}' +
      'video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;cursor:pointer}' +
      '.layer{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:6px;color:#fff;text-align:center;cursor:pointer;padding:16px}' +
      '.layer.on{display:flex}.sound{background:rgba(0,0,0,.25)}.card{background:' + c.cor + ';padding:18px 26px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;gap:4px;animation:pulse 1.6s infinite}' +
      '.card b{font-size:clamp(15px,2.6vw,22px)}.card span{font-size:clamp(13px,2vw,16px);opacity:.9}@keyframes pulse{50%{transform:scale(1.04)}}' +
      '.resume{background:rgba(0,0,0,.7);cursor:default}.resume p{margin:0 0 10px;font-size:16px}.resume button{margin:0 6px;padding:10px 18px;border:0;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer}' +
      '.resume .go{background:' + c.cor + ';color:#fff}.resume .again{background:#fff;color:#111}.paused{background:rgba(0,0,0,.35)}' +
      '.bar{position:absolute;left:0;right:0;bottom:0;height:6px;background:rgba(255,255,255,.25)}.bar.seek{cursor:pointer;height:8px}.fill{height:100%;width:0;background:' + c.cor + ';transition:width .25s linear}' +
      '.ctrl{position:absolute;left:0;right:0;bottom:6px;display:flex;gap:4px;align-items:center;padding:6px 8px;background:linear-gradient(transparent,rgba(0,0,0,.55));opacity:0;transition:opacity .2s}' +
      '.box:hover .ctrl,.ctrl.show{opacity:1}.ctrl button,.ctrl select{background:transparent;border:0;color:#fff;cursor:pointer;padding:6px;border-radius:6px;display:flex}.ctrl select{font-size:13px;background:rgba(0,0,0,.4)}.sp{flex:1}' +
      '.ctas{display:flex;flex-direction:column;gap:8px;margin-top:12px}.over{position:absolute;left:0;right:0;bottom:56px;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none}' +
      '.cta{pointer-events:auto;display:block;text-align:center;text-decoration:none;font-weight:700;font-size:clamp(15px,2.4vw,20px);padding:16px 22px;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.18);animation:in .4s ease-out}' +
      '.over .cta{max-width:90%}@keyframes in{from{opacity:0;transform:translateY(8px)}}' +
      '</style><div class="box"><video playsinline preload="metadata"></video>' +
      '<div class="layer sound"><div class="card">' + icons.sound + '<b></b><span></span></div></div>' +
      '<div class="layer resume"><p>Você já começou a assistir este vídeo.</p><div><button class="go">Continuar</button><button class="again">Começar de novo</button></div></div>' +
      '<div class="layer paused">' + icons.big + '</div>' +
      '<div class="over"></div><div class="ctrl"></div><div class="bar"><div class="fill"></div></div></div><div class="ctas"></div>'
    var $ = function (sel) { return root.querySelector(sel) }
    var v = $('video'), sound = $('.sound'), resume = $('.resume'), paused = $('.paused'), fill = $('.fill'), bar = $('.bar'), ctrl = $('.ctrl')
    sound.querySelector('b').textContent = c.texto_som
    sound.querySelector('span').textContent = c.subtexto_som
    if (c.barra === 'oculta') bar.style.display = 'none'
    if (cfg.capa) v.poster = cfg.capa
    if (!cfg.fonte) { $('.box').insertAdjacentHTML('beforeend', '<div class="layer on" style="cursor:default;background:#111">O vídeo ainda está sendo preparado.</div>'); return }

    var state = { unlocked: !c.autoplay_mudo, key: 'otto_video_' + cfg.codigo }
    var load = function () {
      if (cfg.fonte.tipo === 'hls' && !v.canPlayType('application/vnd.apple.mpegurl')) {
        var h = d.createElement('script')
        h.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.17/hls.min.js'
        h.onload = function () { var hls = new w.Hls({ capLevelToPlayerSize: true }); hls.loadSource(cfg.fonte.url); hls.attachMedia(v) }
        d.head.appendChild(h)
      } else v.src = cfg.fonte.url
    }
    load()

    // ---------- controls ----------
    var btn = function (name, title, fn) { var b = d.createElement('button'); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.innerHTML = icons[name]; b.onclick = function (e) { e.stopPropagation(); fn(b) }; ctrl.appendChild(b); return b }
    var playBtn = ctl.play_pausar ? btn('pause', 'Pausar', function () { toggle() }) : null
    var volBtn = ctl.volume ? btn('vol', 'Som', function (b) { v.muted = !v.muted; b.innerHTML = v.muted ? icons.mute : icons.vol }) : null
    var space = d.createElement('div'); space.className = 'sp'; ctrl.appendChild(space)
    if (ctl.velocidade) {
      var sel = d.createElement('select'); sel.setAttribute('aria-label', 'Velocidade')
      ;['1', '1.25', '1.5', '2'].forEach(function (r) { var o = d.createElement('option'); o.value = r; o.textContent = r.replace('.', ',') + 'x'; sel.appendChild(o) })
      sel.onclick = function (e) { e.stopPropagation() }; sel.onchange = function () { v.playbackRate = Number(sel.value) }; ctrl.appendChild(sel)
    }
    if (ctl.tela_cheia) btn('full', 'Tela cheia', function () { var box = $('.box'); if (d.fullscreenElement) d.exitFullscreen(); else if (box.requestFullscreen) box.requestFullscreen(); else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen() })
    if (!ctl.play_pausar && !ctl.volume && !ctl.tela_cheia && !ctl.velocidade) ctrl.style.display = 'none'
    if (ctl.avancar) {
      bar.classList.add('seek')
      bar.onclick = function (e) { if (!state.unlocked || !v.duration) return; var r = bar.getBoundingClientRect(); v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration }
    }
    var setIcons = function () { if (playBtn) { playBtn.innerHTML = v.paused ? icons.play : icons.pause; playBtn.title = v.paused ? 'Tocar' : 'Pausar' } if (volBtn) volBtn.innerHTML = v.muted ? icons.mute : icons.vol }
    function toggle() {
      if (!state.unlocked) return unlock()
      if (!ctl.play_pausar) return
      if (v.paused) v.play(); else v.pause()
    }

    // ---------- smart autoplay ----------
    function unlock(at) {
      state.unlocked = true
      sound.classList.remove('on'); resume.classList.remove('on')
      v.muted = false
      if (typeof at === 'number') v.currentTime = at
      else if (c.voltar_ao_inicio) v.currentTime = 0
      var p = v.play(); if (p && p.catch) p.catch(function () { paused.classList.add('on') })
      setIcons()
    }
    sound.onclick = function () { unlock() }
    paused.onclick = function () { if (!state.unlocked) unlock(); else { paused.classList.remove('on'); v.play() } }
    v.onclick = toggle

    var saved = 0
    try { saved = Number(localStorage.getItem(state.key) || 0) } catch (_e) { saved = 0 }
    v.addEventListener('loadedmetadata', function () {
      if (c.continuar && saved > 10 && v.duration && saved < v.duration - 10) {
        resume.classList.add('on')
        resume.querySelector('.go').onclick = function () { unlock(saved) }
        resume.querySelector('.again').onclick = function () { unlock(0) }
        return
      }
      if (c.autoplay_mudo) {
        v.muted = true
        var p = v.play()
        if (p && p.then) p.then(function () { sound.classList.add('on') }).catch(function () { paused.classList.add('on') })
        else sound.classList.add('on')
      } else paused.classList.add('on')
    }, { once: true })

    v.addEventListener('play', function () { paused.classList.remove('on'); setIcons() })
    v.addEventListener('pause', function () { if (state.unlocked && !v.ended) paused.classList.add('on'); setIcons() })
    v.addEventListener('volumechange', setIcons)

    // ---------- progress, resume point and buttons ----------
    var below = $('.ctas'), over = $('.over'), shown = {}
    var lastSave = 0
    v.addEventListener('timeupdate', function () {
      var t = v.currentTime, dur = v.duration || cfg.duracao || 0
      if (dur && c.barra !== 'oculta') {
        var p = Math.min(1, t / dur)
        // Accelerated: moves faster at the start (the video feels shorter) and catches up at the end.
        fill.style.width = ((c.barra === 'acelerada' ? 1 - Math.pow(1 - p, 2) : p) * 100) + '%'
      }
      if (state.unlocked && Math.abs(t - lastSave) >= 5) { lastSave = t; try { localStorage.setItem(state.key, String(t)) } catch (_e) { /* bloqueado */ } }
      cfg.botoes.forEach(function (b) {
        var visible = state.unlocked && t >= b.inicio && (b.fim === null || t < b.fim)
        if (visible && !shown[b.id]) {
          var a = d.createElement('a'); a.className = 'cta'; a.href = b.url; a.textContent = b.texto
          a.style.background = b.fundo; a.style.color = b.cor
          if (b.nova_aba) { a.target = '_blank'; a.rel = 'noopener' }
          ;(b.posicao === 'sobre' ? over : below).appendChild(a); shown[b.id] = a
        } else if (!visible && shown[b.id] && b.fim !== null && t >= b.fim) { shown[b.id].remove(); delete shown[b.id] }
      })
    })
    v.addEventListener('ended', function () { try { localStorage.removeItem(state.key) } catch (_e) { /* bloqueado */ } fill.style.width = '100%' })
  }
})()
