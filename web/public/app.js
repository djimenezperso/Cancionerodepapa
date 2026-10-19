/* Cancionero de Papá — página principal (repertorio, nueva canción y vista de cada canción). */
(function () {
  "use strict";
  var VERSION = "18-oct-v7";
  var KEY = "cdp-clave", CACHE = "cdp-canciones", PREF = "cdp-prefs-2";
  var $view = document.getElementById("view"), $marquee = document.getElementById("marquee"), $toast = document.getElementById("toast");
  var state = { songs: null, loading: false, review: null, busy: null, error: null, files: [], q: "" };
  var prefs = load(PREF, { compare: false });
  var photoCache = {};

  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function clave() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }

  // ------------------------------------------------------------ pequeñas ayudas de DOM
  function h(tag, attrs) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (var i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(e, x); });
    else e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  function glyph(name, cls) {
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg"), u = document.createElementNS(ns, "use");
    s.setAttribute("class", "gl " + (cls || "")); s.setAttribute("aria-hidden", "true"); u.setAttribute("href", "#g-" + name); s.appendChild(u); return s;
  }
  function toast(msg, err) {
    $toast.textContent = msg; $toast.className = "toast on" + (err ? " err" : "");
    clearTimeout(toast.t); toast.t = setTimeout(function () { $toast.className = "toast"; }, err ? 5000 : 2200);
  }

  // ------------------------------------------------------------ servidor
  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || "GET", headers: { "x-clave": encodeURIComponent(clave()) } };
    if (opts.body) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(opts.body); }
    var ctl = window.AbortController ? new AbortController() : null, timer = null;
    if (ctl) { init.signal = ctl.signal; timer = setTimeout(function () { ctl.abort(); }, path === "read" || path === "lines" || path === "rhythm" ? 300000 : 40000); }
    return fetch("/api/" + path, init).catch(function (e) {
      throw new Error(e && e.name === "AbortError" ? "El servidor no contesta. Revisa en Vercel que la app esté desplegada y prueba otra vez." : "No hay conexión con el servidor.");
    }).then(function (r) {
      clearTimeout(timer);
      var ct = r.headers.get("content-type") || "";
      if (!opts.raw && r.status === 404 && ct.indexOf("json") < 0) throw new Error("No encuentro el servidor de la app (/api). En Vercel, Settings → General → Root Directory tiene que ser «web».");
      if (opts.raw && r.ok) return r.blob();
      return r.text().then(function (t) {
        var j = {}; try { j = JSON.parse(t); } catch (e) {}
        if (r.status === 401) { try { localStorage.removeItem(KEY); } catch (e) {} route(); }
        if (!r.ok) throw new Error(j.error || (r.status === 413 ? "Las fotos pesan demasiado. Prueba con menos a la vez." : r.status === 504 ? "La IA ha tardado demasiado. Prueba otra vez." : "Error " + r.status));
        return j;
      });
    });
  }
  var saving = Promise.resolve();
  function saveRow(row, quiet) {
    // se guardan de una en una para que GitHub no se líe
    var job = saving.then(function () {
      return api("song", { method: "POST", body: { id: row.id, row: row } }).then(function (res) {
        var r = res.row, list = state.songs || [], i = list.findIndex(function (x) { return x.id === r.id; });
        if (i >= 0) list[i] = r; else list.push(r);
        state.songs = list; store(CACHE, list);
        if (!quiet) toast("Guardado");
        return r;
      });
    });
    saving = job.catch(function () {});
    return job;
  }
  function refresh() {
    state.loading = true;
    return api("songs").then(function (j) {
      state.songs = j.songs; state.error = null; store(CACHE, j.songs);
    }).catch(function (e) { state.error = e.message; }).then(function () { state.loading = false; });
  }
  function photoUrl(path) {
    if (!photoCache[path]) photoCache[path] = api("photo?path=" + encodeURIComponent(path), { raw: true }).then(function (b) { return URL.createObjectURL(b); });
    return photoCache[path];
  }
  function photoB64(path) {
    return photoUrl(path).then(function (u) { return fetch(u); }).then(function (r) { return r.blob(); }).then(blobToB64);
  }
  function blobToB64(b) {
    return new Promise(function (ok, ko) { var fr = new FileReader(); fr.onload = function () { ok(String(fr.result).split(",")[1]); }; fr.onerror = ko; fr.readAsDataURL(b); });
  }
  // la foto se reduce en el móvil antes de subirla (más rápido y cabe en el envío)
  function prepImage(file) {
    return new Promise(function (ok, ko) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var max = 1800, s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        var data = c.toDataURL("image/jpeg", 0.85); URL.revokeObjectURL(url);
        ok({ preview: data, b64: data.split(",")[1] });
      };
      img.onerror = function () { ko(new Error("No se ha podido abrir la foto.")); };
      img.src = url;
    });
  }
  function byId(id) { return (state.songs || []).find(function (r) { return r.id === id; }); }

  // ------------------------------------------------------------ rutas
  window.addEventListener("hashchange", route);
  function route() {
    if (!clave()) return door();
    $marquee.hidden = false;
    var hsh = location.hash.replace(/^#\/?/, ""), parts = hsh.split("/");
    document.querySelectorAll(".tabs a").forEach(function (a) { a.classList.toggle("on", a.dataset.tab === (parts[0] === "nueva" ? "nueva" : parts[0] === "" ? "repertorio" : "")); });
    if (state.songs == null) {
      state.songs = load(CACHE, null);
      if (state.songs == null) { $view.replaceChildren(busy("Abriendo el cancionero…")); refresh().then(function () { if (state.songs == null) state.songs = []; route(); }); return; }
      refresh().then(function () { if (!location.hash.match(/^#\/c\//) && !state.busy) route(); });
    }
    document.body.classList.toggle("on-song", parts[0] === "c");
    if (parts[0] === "nueva") return nueva();
    if (parts[0] === "c" && parts[1]) return cancion(decodeURIComponent(parts[1]));
    repertorio();
  }
  function go(h2) { if (location.hash === h2) route(); else location.hash = h2; }

  // ------------------------------------------------------------ entrada con contraseña
  function door() {
    $marquee.hidden = true; document.body.classList.remove("on-song");
    var err = h("p", { class: "note err", hidden: true });
    var inp = h("input", { class: "input", type: "password", id: "clave", autocomplete: "current-password", required: true });
    var form = h("form", { onsubmit: function (e) {
      e.preventDefault(); err.hidden = true;
      try { localStorage.setItem(KEY, inp.value); } catch (x) {}
      api("check").then(function () { go("#/"); }).catch(function (x) {
        try { localStorage.removeItem(KEY); } catch (y) {}
        err.textContent = x.message; err.hidden = false;
      });
    } },
      h("div", { class: "field" }, h("label", { for: "clave", text: "Contraseña" }), inp),
      err, h("button", { class: "btn primary", type: "submit", text: "Entrar" }));
    $view.replaceChildren(h("section", { class: "door" }, h("div", { class: "door-in" },
      glyph("clef", "clef"),
      h("span", { class: "w1", text: "Cancionero" }), h("span", { class: "w2", text: "de Papá" }), form)));
    setTimeout(function () { inp.focus(); }, 50);
  }

  // ------------------------------------------------------------ repertorio
  function repertorio() {
    var rows = (state.songs || []).slice();
    var q = state.q.trim().toLowerCase();
    if (q) rows = rows.filter(function (r) { return String(r.title || "").toLowerCase().indexOf(q) >= 0; });
    var clean = rows.filter(function (r) { return r.song; }), todo = rows.filter(function (r) { return !r.song; });
    var search = h("input", { class: "input", type: "search", placeholder: "Buscar una canción", "aria-label": "Buscar una canción", value: state.q,
      oninput: function (e) { state.q = e.target.value; var pos = e.target.selectionStart; repertorio(); var s = $view.querySelector("input[type=search]"); s.focus(); s.setSelectionRange(pos, pos); } });
    var body = [h("div", { class: "rep-head" }, search, h("a", { class: "btn primary", href: "#/nueva", text: "Añadir una hoja" }))];
    if (state.error) body.push(h("div", { class: "note err" }, h("p", { text: "No se han podido traer las canciones: " + state.error }),
      h("p", {}, h("button", { class: "btn small", text: "Probar otra vez", onclick: function () { refresh().then(route); } }))));
    if (!(state.songs || []).length && !state.error) {
      body.push(h("div", { class: "empty" }, h("h2", { text: "El atril está vacío" }),
        h("p", { class: "lede", text: "Haz una foto a una hoja de canto y la pasamos a limpio, con su partitura." }),
        h("a", { class: "btn primary", href: "#/nueva", text: "Hacer la primera foto" })));
    } else {
      body.push(h("h2", {}, "Pasadas a limpio", h("span", { class: "count", text: String(clean.length) })));
      body.push(clean.length ? setlist(clean) : h("p", { class: "empty", text: q ? "Ninguna coincide con la búsqueda." : "Todavía ninguna." }));
      if (todo.length) {
        body.push(h("h2", {}, "Por pasar a limpio", h("span", { class: "count", text: String(todo.length) })));
        body.push(setlist(todo));
      }
    }
    body.push(h("div", { class: "foot" },
      h("button", { class: "btn small ghost", text: "Recargar", onclick: function () { refresh().then(function () { route(); toast("Al día"); }); } }),
      h("button", { class: "btn small ghost", text: "Descargar copia de seguridad", onclick: backup }),
      h("span", { class: "lede", style: "margin-left:auto;font-size:13px", text: "Versión " + VERSION }),
      h("button", { class: "btn small ghost", text: "Salir", onclick: function () { try { localStorage.removeItem(KEY); } catch (e) {} route(); } })));
    $view.replaceChildren(h("div", { class: "wrap" }, body));
  }
  function setlist(rows) {
    return h("ul", { class: "setlist" }, rows.map(function (r) {
      var s = r.song || {};
      var meta = [];
      if (s.ts) meta.push(h("span", { text: "Compás " + s.ts }));
      if (s.tempo) meta.push(h("span", { text: "♩ = " + s.tempo }));
      if (!r.song) meta.push(h("span", { text: "Solo la foto" }));
      return h("li", {}, h("button", { class: "track" + (r.song ? "" : " todo"), onclick: function () { go("#/c/" + encodeURIComponent(r.id)); } },
        h("span", { class: "pg" }, r.page ? [r.page, h("small", { text: "hoja" })] : glyph("n8")),
        h("span", {}, h("span", { class: "tt", text: r.title || "Sin título" }), h("span", { class: "mt" }, meta)),
        glyph("n16", "go")));
    }));
  }
  function backup() {
    var blob = new Blob([JSON.stringify(state.songs || [], null, 1)], { type: "application/json" });
    var a = h("a", { href: URL.createObjectURL(blob), download: "cancionero-copia-" + new Date().toISOString().slice(0, 10) + ".json" });
    document.body.appendChild(a); a.click(); a.remove();
  }

  function busy(msg, sub) {
    return h("div", { class: "busy", role: "status" }, glyph("n4", "metro"),
      h("div", {}, h("div", { text: msg }), sub ? h("div", { class: "lede", text: sub }) : null));
  }

  // ------------------------------------------------------------ nueva canción
  function nueva() {
    if (state.busy) { $view.replaceChildren(h("div", { class: "wrap" }, busy(state.busy.msg, state.busy.sub))); return; }
    var title = h("input", { class: "input", id: "nt", placeholder: "Por ejemplo: And I love you so", value: state.newTitle || "", oninput: function (e) { state.newTitle = e.target.value; } });
    function picker(icon, label, sub, capture) {
      var inp = h("input", { type: "file", accept: "image/*", multiple: !capture, capture: capture ? "environment" : null,
        onchange: function (e) {
          var fs = Array.prototype.slice.call(e.target.files || []);
          Promise.all(fs.map(prepImage)).then(function (imgs) { state.files = state.files.concat(imgs).slice(0, 4); nueva(); })
            .catch(function (x) { toast(x.message, true); });
        } });
      return h("label", {}, inp, h("span", { class: "ico", "aria-hidden": "true", text: icon }), h("b", { text: label }), h("span", { text: sub }));
    }
    var body = [h("h1", { style: "font-size:34px", text: "Una hoja nueva" }),
      h("p", { class: "lede", text: "Haz una foto a la hoja (o a sus páginas) y la IA la pasa a limpio. Luego la revisas con la foto al lado." }),
      h("div", { class: "pick" },
        picker("📷", "Hacer una foto", "Con la cámara del móvil", true),
        picker("🖼️", "Elegir de la galería", "Una o varias páginas", false))];
    if (state.files.length) {
      body.push(h("div", { class: "thumbs" }, state.files.map(function (f, i) {
        return h("figure", {}, h("img", { src: f.preview, alt: "Página " + (i + 1) }),
          h("button", { type: "button", "aria-label": "Quitar la página " + (i + 1), text: "✕", onclick: function () { state.files.splice(i, 1); nueva(); } }));
      })));
      body.push(h("div", { class: "form" },
        h("div", { class: "field" }, h("label", { for: "nt", text: "Título (opcional, ayuda a la IA)" }), title),
        h("div", {}, h("button", { class: "btn primary", text: "Pasar a limpio", onclick: function () { readNew(state.files, title.value.trim()); } }))));
    }
    if (state.newError) body.push(h("div", { class: "note err" }, h("p", { text: state.newError })));
    // escribir la letra a mano
    var lt = h("input", { class: "input", id: "lt", placeholder: "Título" });
    var ts = h("select", { class: "input", id: "lts" }, ["4/4", "3/4", "2/4", "6/8", "12/8"].map(function (x) { return h("option", { value: x, text: x }); }));
    var ly = h("textarea", { class: "input", id: "ly", placeholder: "Un verso por línea.\nDeja una línea en blanco entre estrofas." });
    body.push(h("div", { class: "divider" }, glyph("n8")),
      h("h2", { text: "O escribe la letra" }),
      h("p", { class: "lede", text: "Las notas se ponen después, tocándolas o dictando." }),
      h("div", { class: "form", style: "margin-top:14px" },
        h("div", { class: "row2" }, h("div", { class: "field" }, h("label", { for: "lt", text: "Título" }), lt),
          h("div", { class: "field" }, h("label", { for: "lts", text: "Compás" }), ts)),
        h("div", { class: "field" }, h("label", { for: "ly", text: "Letra" }), ly),
        h("div", {}, h("button", { class: "btn", text: "Crear la canción", onclick: function () {
          if (!ly.value.trim()) { toast("Escribe la letra primero", true); return; }
          var song = fromText(lt.value.trim(), ts.value, ly.value);
          saveRow({ title: song.title, page: "", photos: [], song: song }).then(function (r) { go("#/c/" + encodeURIComponent(r.id)); })
            .catch(function (x) { toast(x.message, true); });
        } }))));
    $view.replaceChildren(h("div", { class: "wrap" }, body));
  }
  function fromText(title, ts, text) {
    var sections = [], cur = null;
    text.split(/\r?\n/).forEach(function (line) {
      if (!line.trim()) { cur = null; return; }
      if (!cur) { cur = { label: "", lines: [] }; sections.push(cur); }
      cur.lines.push({ cues: [], units: line.trim().split(/\s+/).map(function (w) { return { t: w, n: [] }; }) });
    });
    return { title: title || "Nueva canción", ts: ts, tempo: 80, page: "", general: [], sections: sections };
  }
  function setBusy(msg, sub) { state.busy = msg ? { msg: msg, sub: sub } : null; route(); }

  function readNew(files, title) {
    state.newError = null;
    var photos = [];
    setBusy("Guardando la foto…");
    var chain = Promise.resolve();
    files.forEach(function (f, i) {
      chain = chain.then(function () { return api("photo", { method: "POST", body: { image: f.b64, base: title || "hoja", i: i + 1 } }); })
        .then(function (r) { photos.push(r.path); });
    });
    chain.then(function () {
      setBusy("Leyendo la hoja…", "Suele tardar uno o dos minutos. No cierres esta pantalla.");
      return api("read", { method: "POST", body: { images: files.map(function (f) { return f.b64; }), title: title } }).then(function (res) {
        return saveRow({ title: res.song.title, page: res.song.page || "", photos: photos, song: res.song }, true).then(function (r) {
          state.review = { id: r.id, doubts: res.doubts, isNew: true };
          finishNew(r);
        });
      }, function (err) {
        // si la IA falla, la foto queda guardada en «Por pasar a limpio»
        return saveRow({ title: title || "Hoja sin título", page: "", photos: photos, song: null }, true).then(function (r) {
          state.readError = err.message; finishNew(r);
        });
      });
    }).catch(function (e) { state.newError = e.message; setBusy(null); });
  }
  function finishNew(r) { state.files = []; state.newTitle = ""; state.busy = null; go("#/c/" + encodeURIComponent(r.id)); }

  // ------------------------------------------------------------ una canción
  var visor = null, visorSong = null;
  function cancion(id) {
    var row = byId(id);
    if (!row) {
      $view.replaceChildren(h("div", { class: "wrap" }, h("p", { class: "lede", text: "No encuentro esta canción." }), h("a", { class: "btn", href: "#/", text: "Volver al repertorio" })));
      return;
    }
    var hasPhotos = (row.photos || []).length > 0, rev = state.review && state.review.id === id ? state.review : null;
    var compare = hasPhotos && (prefs.compare || !row.song);
    var menuOpen = false, pop = h("div", { class: "menu-pop", hidden: true });
    function item(label, sub, fn, cls) { return h("button", { class: cls || null, onclick: function () { pop.hidden = true; fn(); } }, label, sub ? h("small", { text: sub }) : null); }
    if (row.song) pop.append(item("Proponer el ritmo con la IA", "Calcula de nuevo las figuras a partir de los números de tiempo", function () { rhythm(row); }));
    if (hasPhotos) pop.append(item("Volver a leer la hoja", "La IA lee la foto otra vez desde cero", function () { reread(row); }));
    var armed = false;
    pop.append(h("button", { class: "danger", onclick: function (e) {
      if (!armed) { armed = true; e.currentTarget.firstChild.textContent = "Pulsa otra vez para borrarla"; return; }
      pop.hidden = true; remove(row);
    } }, "Borrar esta canción", h("small", { text: "Se borra también la foto" })));
    var bar = h("div", { class: "songbar" },
      h("a", { class: "btn small ghost back", href: "#/", text: "‹ Repertorio" }),
      h("h1", { text: row.title || "Sin título" }),
      hasPhotos && row.song ? h("button", { class: "btn small" + (compare ? " on" : ""), "aria-pressed": compare ? "true" : "false",
        text: compare ? "Ocultar la hoja entera" : "Ver la hoja entera", onclick: function () { prefs.compare = !compare; store(PREF, prefs); cancion(id); } }) : null,
      h("div", { class: "menu" }, h("button", { class: "btn small", "aria-haspopup": "true", text: "Más", onclick: function () { menuOpen = !menuOpen; pop.hidden = !menuOpen; } }), pop));
    var out = [bar];
    if (state.busy) out.push(busy(state.busy.msg, state.busy.sub));
    if (state.readError) { out.push(h("div", { class: "note err" }, h("p", { text: state.readError }))); }
    if (rev) {
      out.push(h("div", { class: "review" },
        h("p", { text: "Ya está guardada. Compárala con la hoja y corrige lo que haga falta (las correcciones se guardan solas)." }),
        h("div", { class: "btns" },
          h("button", { class: "btn small primary", text: "Está bien", onclick: function () { state.review = null; cancion(id); toast("Guardada en el repertorio"); } }),
          h("button", { class: "btn small", text: "Leerla otra vez", onclick: function () { reread(row); } }),
          h("button", { class: "btn small danger", text: "Descartar", onclick: function () { discard(row, rev); } }))));
      if ((rev.doubts || []).length) out.push(h("div", { class: "note" }, h("p", { text: "La IA no lo tenía claro en:" }), h("ul", {}, rev.doubts.map(function (d) { return h("li", { text: d }); }))));
    }
    var stage = h("div", { class: "stage" + (compare && row.song ? " compare" : "") });
    if (compare) {
      var ph = h("div", { class: "sheet-photo", "aria-label": "Hoja original" });
      (row.photos || []).forEach(function (p, i) {
        var img = h("img", { alt: "Hoja original, página " + (i + 1) }); ph.append(img);
        photoUrl(p).then(function (u) { img.src = u; }).catch(function () { img.alt = "No se ha podido cargar la foto"; });
      });
      stage.append(ph);
    }
    if (row.song) {
      visorSong = row;
      visor = h("iframe", { src: "visor.html", title: "Partitura de " + (row.title || "la canción"), allow: "microphone; autoplay" });
      stage.append(h("div", { class: "stand" }, visor));
    } else {
      stage.prepend(h("div", { class: "note" }, h("p", { text: "Esta hoja aún no está pasada a limpio." }),
        h("p", {}, h("button", { class: "btn primary", style: "margin-top:8px", text: "Pasar a limpio con la IA", onclick: function () { reread(row); } }))));
    }
    out.push(stage);
    $view.replaceChildren(h("div", {}, out));
    state.readError = null;
    wake();
  }
  function postSong() {
    if (!visor || !visorSong || !visorSong.song) return;
    var target = visor, row = visorSong;
    Promise.all((row.photos || []).map(function (p) { return photoUrl(p).catch(function () { return ""; }); })).then(function (urls) {
      if (visor !== target || !visor.contentWindow) return;
      visor.contentWindow.postMessage({ type: "song", song: JSON.stringify(row.song), editable: true, photos: urls.filter(Boolean) }, location.origin);
    });
  }
  // la IA busca en la foto dónde está cada verso, para recortarlo
  function locate(row) {
    var lines = [];
    (row.song.sections || []).forEach(function (s) { (s.lines || []).forEach(function (l) { lines.push((l.units || []).map(function (u) { return u.t; }).join(" ").replace(/- /g, "")); }); });
    toast("Buscando los versos en la foto…");
    Promise.all((row.photos || []).map(photoB64)).then(function (imgs) {
      return api("lines", { method: "POST", body: { images: imgs, lines: lines } });
    }).then(function (res) {
      var i = 0;
      (row.song.sections || []).forEach(function (s) { (s.lines || []).forEach(function (l) { var b = res.boxes[i++]; if (b) l.box = b; }); });
      return saveRow(row, true);
    }).then(function () { toast("Recortes encajados"); postSong(); }).catch(function (e) { toast(e.message, true); });
  }
  window.addEventListener("message", function (ev) {
    if (ev.origin !== location.origin || !visor || ev.source !== visor.contentWindow) return;
    var d = ev.data || {};
    if (d.type === "visor-ready") postSong();
    if (d.type === "locate" && visorSong) locate(visorSong);
    if (d.type === "edit" && visorSong) {
      visorSong.song = d.song; visorSong.title = d.song.title || visorSong.title; visorSong.page = d.song.page || visorSong.page || "";
      saveRow(visorSong).catch(function (x) { toast("No se ha guardado: " + x.message, true); });
    }
  });
  var lock = null;
  function wake() { try { if (navigator.wakeLock && !lock) navigator.wakeLock.request("screen").then(function (l) { lock = l; l.addEventListener("release", function () { lock = null; }); }).catch(function () {}); } catch (e) {} }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && /^#\/c\//.test(location.hash)) wake(); });

  function reread(row) {
    var id = row.id;
    setBusy("Leyendo la hoja otra vez…", "Suele tardar uno o dos minutos.");
    Promise.all((row.photos || []).map(photoB64)).then(function (imgs) {
      return api("read", { method: "POST", body: { images: imgs, title: row.title && row.title !== "Hoja sin título" ? row.title : "" } });
    }).then(function (res) {
      var prev = row.song, wasNew = state.review && state.review.id === id ? state.review.isNew : false;
      var keepPrev = state.review && state.review.id === id ? state.review.prev : prev;
      return saveRow({ id: id, title: res.song.title, page: res.song.page || row.page || "", photos: row.photos, song: res.song }, true).then(function () {
        state.review = { id: id, doubts: res.doubts, isNew: wasNew, prev: keepPrev };
      });
    }).catch(function (e) { state.readError = e.message; }).then(function () { setBusy(null); });
  }
  function rhythm(row) {
    setBusy("La IA está proponiendo el ritmo…", "Unos segundos.");
    api("rhythm", { method: "POST", body: { song: row.song } }).then(function (res) {
      return saveRow({ id: row.id, title: row.title, page: row.page, photos: row.photos, song: res.song }, true);
    }).then(function () { toast("Ritmo nuevo guardado"); }).catch(function (e) { state.readError = e.message; }).then(function () { setBusy(null); });
  }
  function discard(row, rev) {
    if (rev.isNew) return remove(row);
    state.review = null;
    saveRow({ id: row.id, title: (rev.prev && rev.prev.title) || row.title, page: row.page, photos: row.photos, song: rev.prev || null }, true)
      .then(function () { toast("Se ha dejado como estaba"); route(); }).catch(function (x) { toast(x.message, true); });
  }
  function remove(row) {
    api("song?id=" + encodeURIComponent(row.id) + "&photos=" + encodeURIComponent((row.photos || []).join(",")), { method: "DELETE" }).then(function () {
      state.songs = (state.songs || []).filter(function (r) { return r.id !== row.id; }); store(CACHE, state.songs);
      if (state.review && state.review.id === row.id) state.review = null;
      toast("Borrada"); go("#/");
    }).catch(function (x) { toast(x.message, true); });
  }

  document.addEventListener("click", function (e) {
    var pop = document.querySelector(".menu-pop:not([hidden])");
    if (pop && !e.target.closest(".menu")) pop.hidden = true;
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
  route();
})();
