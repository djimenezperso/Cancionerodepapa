"""Cancionero de Papá — pasa a limpio hojas de canto (notas, tiempos y apuntes) desde una foto."""
import os

import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

import lib

st.set_page_config(page_title="Cancionero de Papá", page_icon="🎵", layout="wide", initial_sidebar_state="collapsed")

st.markdown(
    """
<style>
@import url('https://fonts.googleapis.com/css2?family=Kalam:wght@700&display=swap');
[data-testid="stSidebar"],[data-testid="stSidebarCollapsedControl"],[data-testid="collapsedControl"]{display:none!important}
.block-container{max-width:1200px;padding-top:2rem}
h1.cdp{font-family:'Kalam',cursive;font-size:2.4rem;margin:0 0 .2rem;line-height:1.1}
h1.cdp span{color:#c2352b}
.stTabs [data-baseweb="tab"]{font-size:1.05rem}
div[data-testid="stImage"] img{border-radius:8px;border:1px solid #d6dce5}
.lbl{font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5d6675;margin:.2rem 0 .4rem}
</style>
<h1 class="cdp">Cancionero <span>de Papá</span></h1>
""",
    unsafe_allow_html=True,
)

# --------------------------------------------------------------------------- configuración (solo en Secrets)


def secret(name, default=""):
    try:
        return st.secrets.get(name, default) or os.environ.get(name, default)
    except Exception:
        return os.environ.get(name, default)


if secret("OPENAI_API_KEY"):
    PROVIDER, KEY, MODEL = "openai", secret("OPENAI_API_KEY"), secret("OPENAI_MODEL", "gpt-5")
elif secret("ANTHROPIC_API_KEY"):
    PROVIDER, KEY, MODEL = "anthropic", secret("ANTHROPIC_API_KEY"), secret("ANTHROPIC_MODEL", "claude-sonnet-5-5")
else:
    PROVIDER, KEY, MODEL = "", "", ""


def sync_store(force=False):
    """Trae las canciones de la rama «datos» de GitHub. Se repite en cada visita nueva y, como mucho, cada minuto:
    al actualizar la app, Streamlit devuelve la carpeta songs/ a la versión del repositorio y hay que recuperarlas."""
    import time

    tok, repo = secret("GITHUB_TOKEN"), secret("GITHUB_REPO")
    if not tok or not repo:
        return ""
    lib.GH.update(token=tok.strip(), repo=repo.strip().strip("/"))
    if force or not st.session_state.get("synced") or time.time() - lib.GH.get("last", 0) > 60:
        err = lib.gh_sync(tok, repo)
        if err:
            time.sleep(1.5)
            err = lib.gh_sync(tok, repo)
        st.session_state.synced = True
        st.session_state.sync_err = err
    return st.session_state.get("sync_err", "")


SYNC_ERR = sync_store()
if not (secret("GITHUB_TOKEN") and secret("GITHUB_REPO")):
    st.error("⚠️ Las canciones NO se están guardando de forma permanente: faltan GITHUB_TOKEN y GITHUB_REPO en Streamlit → Settings → Secrets. Todo lo que pases a limpio se perderá al actualizar la app.")
elif SYNC_ERR:
    st.error("⚠️ No se puede guardar en GitHub, así que las canciones se perderán al actualizar la app. Motivo: " + SYNC_ERR)

# --------------------------------------------------------------------------- utilidades

for k, v in {"sel": None, "flash": None, "pending": None, "view": "lib"}.items():
    st.session_state.setdefault(k, v)


def flash(kind, msg):
    st.session_state.flash = (kind, msg)


def show_flash():
    if st.session_state.flash:
        kind, msg = st.session_state.flash
        getattr(st, kind)(msg)
        st.session_state.flash = None


VISOR_DIR = lib.ASSETS / "visor"
try:
    visor_component = components.declare_component("visor", path=str(VISOR_DIR)) if (VISOR_DIR / "index.html").exists() else None
except Exception:
    visor_component = None


def viewer(song, key="v", editable=False):
    """Muestra la canción. Si editable, devuelve la canción cambiada cuando se pulsa «Guardar cambios»."""
    import json as _json

    if visor_component is None:  # falta assets/visor/index.html: se muestra sin poder cambiar notas
        if editable:
            st.caption("Para poder cambiar notas falta subir el archivo assets/visor/index.html a GitHub.")
        components.html(lib.viewer_html([song]), height=900, scrolling=True)
        return None
    css, js = lib.visor_assets()
    res = visor_component(song=_json.dumps(song, ensure_ascii=False), css=css, js=js, editable=editable, key=key, default=None)
    if editable and res and res.get("nonce") and st.session_state.get(f"done-{key}") != res["nonce"]:
        st.session_state[f"done-{key}"] = res["nonce"]
        return lib.normalize(res.get("song"))
    return None


def label(row):
    t = row.get("title") or "Sin título"
    extra = []
    if row.get("page"):
        extra.append(f"hoja {row['page']}")
    if not row.get("song"):
        extra.append("sin pasar a limpio")
    return t + (f"  ·  {' · '.join(extra)}" if extra else "")


def safe(fn, *a, **kw):
    """Ejecuta una acción de guardado y avisa si GitHub falla (la canción queda al menos en local)."""
    try:
        return fn(*a, **kw), None
    except RuntimeError as e:
        return None, str(e)


def transcribe(images, title_hint=""):
    if not KEY:
        st.error("La app no tiene clave de IA configurada. Hay que ponerla en Streamlit → Settings → Secrets (OPENAI_API_KEY).")
        return None
    with st.spinner("Leyendo la hoja… con letra a mano tarda uno o dos minutos."):
        try:
            return lib.read_sheet(images, KEY, MODEL, title_hint, PROVIDER)
        except lib.ReadError as e:
            st.error(str(e))
        except Exception as e:
            st.error(f"Algo ha fallado al leer la foto: {e}")
    return None


def side_by_side(images, song, key, editable=False):
    """Hoja original a la izquierda, versión limpia a la derecha (en el móvil, una debajo de otra)."""
    c1, c2 = st.columns([1, 1.25], gap="medium")
    with c1:
        st.markdown('<p class="lbl">Hoja original</p>', unsafe_allow_html=True)
        for im in images:
            st.image(im, use_container_width=True)
    with c2:
        st.markdown('<p class="lbl">Pasada a limpio</p>', unsafe_allow_html=True)
        return viewer(song, key=f"v-{key}", editable=editable)


@st.cache_data(show_spinner=False, max_entries=500)
def thumb(rel, mtime):
    import io
    from PIL import Image

    data = lib.photo_bytes(rel)
    if not data:
        return None
    im = Image.open(io.BytesIO(data)).convert("RGB")
    w, h = im.size
    im = im.crop((0, 0, w, min(h, int(w * 0.75))))  # parte de arriba de la hoja: título y primeros versos
    im.thumbnail((420, 420))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=75)
    return buf.getvalue()


def song_state(r):
    if not r.get("song"):
        return "📷 Solo foto"
    has_dur = any("d" in u for sec in r["song"].get("sections", []) for line in sec.get("lines", []) for u in line.get("units", []))
    return "🎼 Con partitura" if has_dur else "✅ Pasada a limpio"


def song_card(col, r, stt):
    with col.container(border=True):
        ph = (r.get("photos") or [None])[0]
        img = None
        if ph:
            f = lib.ROOT / ph
            img = thumb(ph, f.stat().st_mtime if f.exists() else 0)
        if img:
            st.image(img, use_container_width=True)
        else:
            st.markdown("<div style='height:90px;display:flex;align-items:center;justify-content:center;font-size:2.4rem;background:#eef1f6;border-radius:8px'>🎵</div>", unsafe_allow_html=True)
        st.markdown(f"**{r.get('title') or 'Sin título'}**")
        st.caption(stt + (f" · hoja {r['page']}" if r.get("page") else ""))
        if st.button("Abrir", key=f"open-{r['id']}", use_container_width=True, type="primary" if r.get("song") else "secondary"):
            st.session_state.sel = r["id"]
            st.session_state.view = "song"
            st.rerun()


def card_grid(items, per_row=4):
    for i in range(0, len(items), per_row):
        cols = st.columns(per_row, gap="small")
        for col, (r, stt) in zip(cols, items[i : i + per_row]):
            song_card(col, r, stt)


def library(rows):
    """Biblioteca en dos apartados: las limpias y las que faltan por pasar a limpio."""
    q = st.text_input("🔎 Buscar", key="libq", placeholder="Buscar por título", label_visibility="collapsed")
    items = [(r, song_state(r)) for r in rows if not q or q.lower() in (r.get("title") or "").lower()]
    clean = [x for x in items if x[0].get("song")]
    todo = [x for x in items if not x[0].get("song")]
    st.markdown(f"#### ✨ Limpias ({len(clean)})")
    if clean:
        card_grid(clean)
    else:
        st.caption("Aún no hay ninguna pasada a limpio." if not q else "Ninguna limpia con ese título.")
    st.markdown(f"#### 📷 Por pasar a limpio ({len(todo)})")
    if todo:
        card_grid(todo)
    else:
        st.caption("¡Todas pasadas a limpio!" if not q else "Ninguna con ese título.")


def tools_panel(row, sel):
    """Columna lateral: preparar partitura y corregir hablando."""
    has_dur = any("d" in u for sec in row["song"].get("sections", []) for line in sec.get("lines", []) for u in line.get("units", []))
    st.markdown('<p class="lbl">Herramientas</p>', unsafe_allow_html=True)
    if st.button("🎼 La IA propone el ritmo otra vez" if has_dur else "🎼 Preparar la partitura", key=f"rhy-{sel}", use_container_width=True):
        if not KEY:
            st.error("La app no tiene clave de IA configurada.")
        else:
            with st.spinner("Calculando el ritmo…"):
                try:
                    row["song"] = lib.estimate_rhythm(row["song"], KEY, MODEL, PROVIDER)
                    _, err = safe(lib.save_song, row, sel)
                    flash("warning" if err else "success", ("Guardado aquí, pero no en GitHub: " + err) if err else "Ritmo calculado. Mira la «🎼 Partitura».")
                    st.rerun()
                except lib.ReadError as e:
                    st.error(str(e))
    photos = [lib.photo_bytes(p) for p in row.get("photos") or [] if lib.photo_bytes(p)]
    if photos and st.button("🔄 Volver a leer la hoja", key=f"reread-{sel}", use_container_width=True, help="La IA vuelve a leer la foto desde cero (se pierden los cambios hechos a mano)."):
        res = transcribe(photos, row.get("title", ""))
        if res:
            autosave_reading(res[0], res[1], photos, sel)
            st.rerun()
    st.caption("Calcula cuánto dura cada nota (negra, corchea…) para dibujar la partitura. Si ya lo hiciste, vuelve a calcularlo todo desde cero: solo úsalo si las duraciones salen muy mal, porque borra las que hayas puesto a mano." if has_dur else "Calcula cuánto dura cada nota (negra, corchea…) para poder dibujar la partitura.")
    st.markdown("**🎤 Corregir hablando**")
    st.caption("Frases largas, por ejemplo: «en “so”, redonda ligada a negra con puntillo; la primera nota es Fa, no La». Para ir nota a nota, usa «🎤 Dictar» en la canción.")
    if PROVIDER != "openai":
        st.info("Necesita la clave de OpenAI (OPENAI_API_KEY) en Secrets.")
        return
    rec = st.audio_input("Grabar", key=f"rec-{sel}", label_visibility="collapsed") if hasattr(st, "audio_input") else st.file_uploader("Nota de voz", type=["wav", "mp3", "m4a", "ogg", "webm"], key=f"rec-{sel}")
    vk = f"voice-{sel}"
    if rec is not None and st.button("🪄 Entender", type="primary", key=f"vgo-{sel}", use_container_width=True):
        with st.spinner("Escuchando…"):
            try:
                said = lib.transcribe_voice(rec.getvalue(), KEY, getattr(rec, "name", None) or "voz.wav")
                new_song, summary, missing = lib.voice_changes(row["song"], said, KEY, MODEL, PROVIDER)
                st.session_state[vk] = {"said": said, "song": new_song, "summary": summary, "missing": missing}
            except lib.ReadError as e:
                st.error(str(e))
    prop = st.session_state.get(vk)
    if prop:
        st.markdown(f"**He oído:** «{prop['said']}»")
        if prop["summary"]:
            st.markdown("\n".join(f"- {x}" for x in prop["summary"]))
        else:
            st.warning("No he encontrado nada que cambiar.")
        if prop["missing"]:
            st.warning("No he podido aplicar: " + prop["missing"])
        if st.button("✅ Aceptar cambios", type="primary", use_container_width=True, key=f"vok-{sel}", disabled=not prop["summary"]):
            row["song"] = prop["song"]
            _, err = safe(lib.save_song, row, sel)
            st.session_state.pop(vk, None)
            flash("warning" if err else "success", ("Guardado aquí, pero no en GitHub: " + err) if err else "Cambios guardados.")
            st.rerun()
        if st.button("Descartar", use_container_width=True, key=f"vno-{sel}"):
            st.session_state.pop(vk, None)
            st.rerun()


def autosave_reading(song, doubts, images, target=None):
    """Guarda la lectura nada más terminar y abre la revisión (ya guardada)."""
    err = None
    prev = None
    if target:
        row = lib.get_song(target) or {}
        prev = row.get("song")
        row.update(song=song, title=song["title"] or row.get("title", ""), page=song.get("page") or row.get("page", ""))
        _, err = safe(lib.save_song, row, target)
        sid = target
    else:
        photos, err = safe(lib.store_photos, images, song["title"])
        sid, err2 = safe(lib.save_song, {"title": song["title"], "page": song.get("page", ""), "photos": photos or [], "song": song})
        err = err or err2
    st.session_state.pending = {"song": song, "doubts": doubts, "images": images, "target": sid, "prev": prev, "new": not target, "err": err}
    st.session_state.sel = sid
    st.session_state.view = "song"


# --------------------------------------------------------------------------- revisión (ya guardada)

pend = st.session_state.pending
if pend:
    st.subheader("👀 Revisa la hoja")
    if pend.get("err"):
        st.warning("Guardada aquí, pero no en GitHub: " + pend["err"])
    else:
        st.success("✅ Ya está guardada. Compárala con la hoja y corrige lo que haga falta (los cambios también se guardan).")
    if pend.get("doubts"):
        st.warning("Cosas que no se leían bien: " + " · ".join(pend["doubts"]))
    edited = side_by_side(pend["images"], pend["song"], "pend", editable=True)
    if edited:
        pend["song"] = edited
        row = lib.get_song(pend["target"]) or {}
        row.update(song=edited, title=edited["title"], page=edited.get("page", ""))
        _, pend["err"] = safe(lib.save_song, row, pend["target"])
        st.rerun()
    b1, b2, b3 = st.columns(3)
    if b1.button("👍 Listo", type="primary", use_container_width=True, key="pend-ok"):
        st.session_state.sel = pend["target"]
        st.session_state.view = "song"
        st.session_state.pending = None
        st.rerun()
    if b2.button("🔄 Volver a leer la hoja", use_container_width=True, key="pend-again"):
        res = transcribe(pend["images"], pend["song"].get("title", ""))
        if res:
            prev, new = pend.get("prev"), pend.get("new")
            autosave_reading(res[0], res[1], pend["images"], pend["target"])
            st.session_state.pending.update(prev=prev, new=new)
            st.rerun()
    if b3.button("🗑️ Descartar", use_container_width=True, key="pend-drop"):
        if pend.get("new"):
            _, err = safe(lib.delete_song, pend["target"])
            st.session_state.sel = None
            st.session_state.view = "lib"
            flash("info", "Lectura descartada.")
        else:
            row = lib.get_song(pend["target"]) or {}
            row["song"] = pend.get("prev")
            _, err = safe(lib.save_song, row, pend["target"])
            flash("info", "Se ha dejado la versión anterior.")
        st.session_state.pending = None
        st.rerun()
    st.divider()

tab_saved, tab_new, tab_go = st.tabs(["📚 Canciones guardadas", "📷 Nueva canción", "📲 Llevar en el móvil"])

# --------------------------------------------------------------------------- guardadas

with tab_saved:
    show_flash()
    rows = lib.list_songs()
    ids = [r["id"] for r in rows]
    if not rows:
        st.info("Todavía no hay canciones. Ve a «Nueva canción» y haz una foto a una hoja.")
    elif st.session_state.get("view") != "song" or st.session_state.sel not in ids:
        library(rows)
    else:
        sel = st.session_state.sel
        nb1, nb2 = st.columns([1, 5])
        if nb1.button("← Biblioteca", key="back-lib", use_container_width=True):
            st.session_state.view = "lib"
            st.rerun()
        nb2.markdown(f"### {label(next(r for r in rows if r['id'] == sel))}")
        row = lib.get_song(sel)
        photos = [lib.photo_bytes(p) for p in row.get("photos") or [] if lib.photo_bytes(p)]

        if row.get("song"):
            compare = bool(photos) and st.toggle("📄 Ver la hoja original al lado", value=False, key=f"cmp-{sel}")
            if compare:
                c_photo, c_view, c_tools = st.columns([1, 1.35, 0.75], gap="medium")
                with c_photo:
                    st.markdown('<p class="lbl">Hoja original</p>', unsafe_allow_html=True)
                    for im in photos:
                        st.image(im, use_container_width=True)
            else:
                c_view, c_tools = st.columns([2.4, 0.8], gap="medium")
            with c_view:
                edited = viewer(row["song"], key=f"v-{sel}", editable=True)
            if edited:
                row["song"], row["title"], row["page"] = edited, edited["title"], edited.get("page", "")
                _, err = safe(lib.save_song, row, sel)
                flash("warning" if err else "success", ("Guardado aquí, pero no en GitHub: " + err) if err else "Cambios guardados.")
                st.rerun()
            with c_tools:
                tools_panel(row, sel)
        else:
            st.info("Esta hoja aún no está pasada a limpio.")
            if st.button("✨ Pasar a limpio esta hoja", type="primary", use_container_width=True, disabled=not photos, key=f"read-{sel}"):
                res = transcribe(photos, row.get("title", ""))
                if res:
                    autosave_reading(res[0], res[1], photos, sel)
                    st.rerun()
            for im in photos:
                st.image(im, use_container_width=True)


        with st.expander("🗑️ Borrar esta canción"):
            st.write("Se borra la canción y su foto. No se puede deshacer.")
            if st.button("Borrar definitivamente", key=f"del-{sel}"):
                _, err = safe(lib.delete_song, sel)
                st.session_state.sel = None
                st.session_state.view = "lib"
                flash("warning" if err else "info", ("Borrada aquí, pero no en GitHub: " + err) if err else "Canción borrada.")
                st.rerun()

# --------------------------------------------------------------------------- nueva

with tab_new:
    mode = st.radio("¿Cómo la quieres añadir?", ["📷 Cámara", "🖼️ Galería", "⌨️ Escribir la letra"], horizontal=True, label_visibility="collapsed", key="mode")
    images = []
    if mode == "📷 Cámara":
        shot = st.camera_input("Haz la foto a la hoja, de frente y con buena luz", key="cam")
        if shot:
            images = [shot.getvalue()]
        st.caption("Si la cámara sale pequeña o no enfoca bien, usa «Galería»: en el móvil te deja hacer la foto con la cámara normal.")
    elif mode == "🖼️ Galería":
        ups = st.file_uploader("Elige una o varias fotos (en orden si la canción ocupa varias hojas)", type=["jpg", "jpeg", "png", "webp"], accept_multiple_files=True, key="ups")
        images = [u.getvalue() for u in ups or []]
        if images:
            cols = st.columns(min(4, len(images)))
            for c, im in zip(cols, images):
                c.image(im, use_container_width=True)

    if mode != "⌨️ Escribir la letra":
        title_hint = st.text_input("Título (opcional, ayuda a acertar el compás)", key="hint")
        c1, c2 = st.columns(2)
        go = c1.button("✨ Pasar a limpio", type="primary", use_container_width=True, disabled=not images, key="new-read")
        only = c2.button("💾 Guardar solo la foto", use_container_width=True, disabled=not images, key="new-photo")
        if only and images:
            photos, err = safe(lib.store_photos, images, title_hint or "hoja")
            sid, err2 = safe(lib.save_song, {"title": title_hint or "Hoja sin título", "page": "", "photos": photos or [], "song": None})
            err = err or err2
            st.session_state.sel = sid
            st.session_state.view = "song"
            flash("warning" if err else "success", ("Guardada aquí, pero no en GitHub: " + err) if err else "Foto guardada en «Canciones guardadas». Pásala a limpio cuando quieras.")
            st.rerun()
        if go and images:
            res = transcribe(images, title_hint)
            if res:
                autosave_reading(res[0], res[1], images, None)
                st.rerun()
    else:
        t = st.text_input("Título", key="mt")
        ts = st.selectbox("Compás", lib.TIME_SIGNATURES, index=2, key="mts")
        lyr = st.text_area("Letra: un verso por línea, una línea en blanco entre estrofas", height=220, key="mlyr")
        st.caption("Después, en «Canciones guardadas» → «Corregir», pon la nota y el tiempo de cada sílaba.")
        if st.button("Crear canción", type="primary", disabled=not lyr.strip(), key="mk"):
            song = lib.song_from_text(t, ts, lyr)
            sid, err = safe(lib.save_song, {"title": song["title"], "page": "", "photos": [], "song": song})
            st.session_state.sel = sid
            st.session_state.view = "song"
            flash("warning" if err else "success", ("Guardada aquí, pero no en GitHub: " + err) if err else "Canción creada. Ábrela en «Corregir» para añadir las notas.")
            st.rerun()
    show_flash()

# --------------------------------------------------------------------------- móvil / copias

with tab_go:
    rows = [r for r in lib.list_songs() if r.get("song")]
    st.markdown("**Para el bus:** descarga un único archivo con todas las canciones pasadas a limpio. Se abre en el móvil sin internet, con la melodía y el metrónomo.")
    st.download_button(
        "📲 Descargar el cancionero (sin internet)", lib.viewer_html([r["song"] for r in rows], embedded=False),
        file_name="cancionero-de-papa.html", mime="text/html", type="primary", use_container_width=True, disabled=not rows, key="dl-all",
    )
    st.caption("En Android, guárdalo y ábrelo desde «Archivos» con Chrome. En iPhone, guárdalo en «Archivos» y ábrelo desde ahí.")
    with st.expander("Copia de seguridad"):
        if lib.gh_enabled() and not SYNC_ERR:
            st.success("Las canciones se guardan solas en GitHub y no se pierden al reiniciar.")
        if lib.gh_enabled() and st.button("🔄 Recargar las canciones desde GitHub", key="resync", help="Vuelve a descargar todas las canciones guardadas en GitHub."):
            sync_store(force=True)
            st.rerun()
        elif SYNC_ERR:
            st.error("No se puede guardar en GitHub: " + SYNC_ERR)
        else:
            st.warning("Falta configurar GitHub en Secrets (GITHUB_TOKEN y GITHUB_REPO): las canciones nuevas se pierden si la app se reinicia.")
        st.download_button("⬇️ Descargar copia (con fotos)", lib.export_backup(), file_name="cancionero-copia.json", mime="application/json", use_container_width=True, key="dl-bk")
        up = st.file_uploader("Recuperar una copia", type=["json"], key="restore")
        if up and st.button("Recuperar", key="restore-go"):
            try:
                n = lib.import_backup(up.getvalue().decode("utf-8"))
                flash("success", f"Recuperadas {n} canciones.")
                st.rerun()
            except Exception as e:
                st.error(f"Ese archivo no es una copia válida del cancionero ({e}).")
