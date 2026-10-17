"""Cancionero de Papá — pasa a limpio hojas de canto (notas, tiempos y apuntes) desde una foto."""
import os

import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

import lib

st.set_page_config(page_title="Cancionero de Papá", page_icon="🎵", layout="centered")

st.markdown(
    """
<style>
@import url('https://fonts.googleapis.com/css2?family=Kalam:wght@700&display=swap');
h1.cdp{font-family:'Kalam',cursive;font-size:2.4rem;margin:0 0 .2rem;line-height:1.1}
h1.cdp span{color:#c2352b}
.stTabs [data-baseweb="tab"]{font-size:1rem}
div[data-testid="stImage"] img{border-radius:8px}
</style>
<h1 class="cdp">Cancionero <span>de Papá</span></h1>
""",
    unsafe_allow_html=True,
)
st.caption("Haz una foto a la hoja y se pasa a limpio: notas, tiempos del compás y apuntes de técnica, con metrónomo.")

# --------------------------------------------------------------------------- ajustes

MODELS = ["claude-sonnet-5-5", "claude-opus-5-5", "claude-haiku-5-5"]


def secret(name, default=""):
    try:
        return st.secrets.get(name, default)
    except Exception:
        return os.environ.get(name, default)


with st.sidebar:
    st.subheader("Ajustes")
    key = secret("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_API_KEY", "")
    if key:
        st.success("Clave de la API configurada.")
    else:
        key = st.text_input("Clave de la API de Claude", type="password", help="Se consigue en console.anthropic.com. Solo se usa para leer las fotos.")
    model = st.selectbox("Modelo para leer las fotos", MODELS, index=0, help="Opus lee mejor la letra a mano; Haiku es el más barato.")
    st.divider()
    st.caption("Las canciones se guardan en la carpeta `songs/` de la app. En Streamlit Cloud esa carpeta se borra al reiniciar: descarga una copia de seguridad de vez en cuando (pestaña «Llevar en el móvil»).")

# --------------------------------------------------------------------------- utilidades

if "sel" not in st.session_state:
    st.session_state.sel = None
if "flash" not in st.session_state:
    st.session_state.flash = None


def flash(kind, msg):
    st.session_state.flash = (kind, msg)


def show_flash():
    if st.session_state.flash:
        kind, msg = st.session_state.flash
        getattr(st, kind)(msg)
        st.session_state.flash = None


def viewer(song, height=None):
    lines = sum(len(s.get("lines", [])) for s in song.get("sections", []))
    h = height or min(2400, 260 + lines * 150 + (60 if song.get("general") else 0))
    components.html(lib.viewer_html([song]), height=h, scrolling=True)


def label(row):
    t = row.get("title") or "Sin título"
    extra = []
    if row.get("page"):
        extra.append(f"hoja {row['page']}")
    if not row.get("song"):
        extra.append("solo foto")
    return t + (f"  ·  {' · '.join(extra)}" if extra else "")


def transcribe(images, title_hint=""):
    if not key:
        st.error("Falta la clave de la API de Claude. Escríbela en la barra lateral (en el móvil, la flecha arriba a la izquierda).")
        return None
    with st.spinner("Leyendo la hoja… con letra a mano tarda uno o dos minutos."):
        try:
            song, doubts = lib.read_sheet(images, key, model, title_hint)
        except lib.ReadError as e:
            st.error(str(e))
            return None
        except Exception as e:  # red, etc.
            st.error(f"Algo ha fallado al leer la foto: {e}")
            return None
    return song, doubts


tab_saved, tab_new, tab_go = st.tabs(["📚 Canciones guardadas", "📷 Nueva canción", "📲 Llevar en el móvil"])

# --------------------------------------------------------------------------- guardadas

with tab_saved:
    show_flash()
    rows = lib.list_songs()
    if not rows:
        st.info("Todavía no hay canciones. Ve a «Nueva canción» y haz una foto a una hoja.")
    else:
        ids = [r["id"] for r in rows]
        if st.session_state.sel not in ids:
            st.session_state.sel = ids[0]
        sel = st.selectbox("Canción", ids, index=ids.index(st.session_state.sel), format_func=lambda i: label(next(r for r in rows if r["id"] == i)))
        st.session_state.sel = sel
        row = lib.get_song(sel)
        photos = [p for p in row.get("photos") or [] if lib.photo_bytes(p)]

        if row.get("song"):
            viewer(row["song"])
        else:
            st.warning("Esta hoja aún no está pasada a limpio. Pulsa el botón para que Claude la lea.")
            if st.button("✨ Pasar a limpio con Claude", type="primary", use_container_width=True, disabled=not photos):
                res = transcribe([lib.photo_bytes(p) for p in photos], row.get("title", ""))
                if res:
                    song, doubts = res
                    row["song"] = song
                    row["title"] = song["title"] or row.get("title")
                    row["page"] = song.get("page") or row.get("page", "")
                    lib.save_song(row, sel)
                    flash("success", "Listo." + (" Revisa: " + " · ".join(doubts) if doubts else " Compruébalo con «Escuchar»."))
                    st.rerun()

        if photos:
            with st.expander("🖼️ Hoja original", expanded=not row.get("song")):
                for p in photos:
                    st.image(lib.photo_bytes(p), use_container_width=True)

        if row.get("song"):
            with st.expander("✏️ Corregir notas, tiempos y apuntes"):
                song = row["song"]
                c1, c2 = st.columns([2, 1])
                title = c1.text_input("Título", song["title"], key=f"t-{sel}")
                page = c2.text_input("Hoja nº", song.get("page", ""), key=f"p-{sel}")
                c3, c4 = st.columns(2)
                ts = c3.selectbox("Compás", lib.TIME_SIGNATURES, index=lib.TIME_SIGNATURES.index(song["ts"]), key=f"ts-{sel}")
                tempo = c4.number_input("Velocidad (♩ por minuto)", 30, 240, int(song["tempo"]), key=f"bpm-{sel}")
                general = st.text_area("Apuntes generales (uno por línea)", "\n".join(song.get("general", [])), key=f"g-{sel}")
                units, lines = lib.song_to_rows(song)
                m = lib.beats_per_bar(ts)
                st.caption("Cada fila es una sílaba o palabra. «Tiempo» es el número de colores; «hasta» es el tiempo donde termina si la nota se aguanta (el «4-1»). Para añadir una fila, usa la última línea vacía de la tabla.")
                eu = st.data_editor(
                    pd.DataFrame(units, columns=["verso", "sílaba", "notas", "tiempo", "hasta", "amarillo", "subrayado", "pausa", "círculo"]),
                    num_rows="dynamic",
                    use_container_width=True,
                    hide_index=True,
                    key=f"u-{sel}",
                    column_config={
                        "verso": st.column_config.NumberColumn("Verso", min_value=1, step=1, width="small"),
                        "sílaba": st.column_config.TextColumn("Sílaba"),
                        "notas": st.column_config.TextColumn("Notas", help="Varias en la misma sílaba: Sib - Re#4"),
                        "tiempo": st.column_config.SelectboxColumn("Tiempo", options=list(range(1, m + 1)), width="small"),
                        "hasta": st.column_config.SelectboxColumn("Hasta", options=list(range(1, m + 1)), width="small"),
                        "amarillo": st.column_config.CheckboxColumn("Amarillo", width="small"),
                        "subrayado": st.column_config.CheckboxColumn("Flecha", width="small"),
                        "pausa": st.column_config.CheckboxColumn("Punto", width="small"),
                        "círculo": st.column_config.TextColumn("Círculo", width="small"),
                    },
                )
                st.caption("Apuntes de técnica por verso (sepáralos con /). «Parte» pone un título encima del verso, por ejemplo «Estribillo».")
                el = st.data_editor(
                    pd.DataFrame(lines, columns=["verso", "parte", "apuntes"]),
                    num_rows="dynamic",
                    use_container_width=True,
                    hide_index=True,
                    key=f"l-{sel}",
                    column_config={
                        "verso": st.column_config.NumberColumn("Verso", min_value=1, step=1, width="small"),
                        "parte": st.column_config.TextColumn("Parte", width="small"),
                        "apuntes": st.column_config.TextColumn("Apuntes", width="large"),
                    },
                )
                if st.button("💾 Guardar cambios", type="primary"):
                    meta = {"title": title, "page": page, "ts": ts, "tempo": tempo, "general": [g for g in general.splitlines() if g.strip()]}
                    new = lib.rows_to_song(meta, eu.to_dict("records"), el.to_dict("records"))
                    row["song"], row["title"], row["page"] = new, new["title"], new["page"]
                    lib.save_song(row, sel)
                    flash("success", "Cambios guardados.")
                    st.rerun()
                if row.get("song") and photos:
                    if st.button("🔄 Volver a leer la foto con Claude"):
                        res = transcribe([lib.photo_bytes(p) for p in photos], row.get("title", ""))
                        if res:
                            row["song"] = res[0]
                            lib.save_song(row, sel)
                            flash("success", "Hoja leída de nuevo." + (" Revisa: " + " · ".join(res[1]) if res[1] else ""))
                            st.rerun()

        with st.expander("🗑️ Borrar esta canción"):
            st.write("Se borra la canción y su foto. No se puede deshacer.")
            if st.button("Borrar definitivamente", key=f"del-{sel}"):
                lib.delete_song(sel)
                st.session_state.sel = None
                flash("info", "Canción borrada.")
                st.rerun()

# --------------------------------------------------------------------------- nueva

with tab_new:
    mode = st.radio("¿Cómo la quieres añadir?", ["📷 Cámara", "🖼️ Galería", "⌨️ Escribir la letra"], horizontal=True, label_visibility="collapsed")
    images = []
    if mode == "📷 Cámara":
        shot = st.camera_input("Haz la foto a la hoja, de frente y con buena luz")
        if shot:
            images = [shot.getvalue()]
        st.caption("Si la cámara sale pequeña o no enfoca bien, usa «Galería»: en el móvil te deja hacer la foto con la cámara normal.")
    elif mode == "🖼️ Galería":
        ups = st.file_uploader("Elige una o varias fotos (en orden si la canción ocupa varias hojas)", type=["jpg", "jpeg", "png", "webp", "heic"], accept_multiple_files=True)
        images = [u.getvalue() for u in ups or []]
        if images:
            cols = st.columns(min(4, len(images)))
            for c, im in zip(cols, images):
                c.image(im, use_container_width=True)

    if mode != "⌨️ Escribir la letra":
        title_hint = st.text_input("Título (opcional, ayuda a acertar el compás)")
        c1, c2 = st.columns(2)
        go = c1.button("✨ Pasar a limpio", type="primary", use_container_width=True, disabled=not images)
        only = c2.button("💾 Guardar solo la foto", use_container_width=True, disabled=not images)
        if only and images:
            sid = lib.save_song({"title": title_hint or "Hoja sin título", "page": "", "photos": lib.store_photos(images, title_hint or "hoja"), "song": None})
            st.session_state.sel = sid
            flash("success", "Foto guardada. Está en «Canciones guardadas»; pásala a limpio cuando quieras.")
            st.rerun()
        if go and images:
            res = transcribe(images, title_hint)
            if res:
                song, doubts = res
                sid = lib.save_song({"title": song["title"], "page": song.get("page", ""), "photos": lib.store_photos(images, song["title"]), "song": song})
                st.session_state.sel = sid
                flash("success", "Guardada en «Canciones guardadas»." + (" Revisa: " + " · ".join(doubts) if doubts else ""))
                st.rerun()
    else:
        t = st.text_input("Título")
        ts = st.selectbox("Compás", lib.TIME_SIGNATURES, index=2)
        lyr = st.text_area("Letra: un verso por línea, una línea en blanco entre estrofas", height=220)
        st.caption("Después, en «Canciones guardadas» → «Corregir», pon la nota y el tiempo de cada sílaba.")
        if st.button("Crear canción", type="primary", disabled=not lyr.strip()):
            song = lib.song_from_text(t, ts, lyr)
            st.session_state.sel = lib.save_song({"title": song["title"], "page": "", "photos": [], "song": song})
            flash("success", "Canción creada. Ábrela en «Corregir» para añadir las notas.")
            st.rerun()
    show_flash()

# --------------------------------------------------------------------------- móvil / copias

with tab_go:
    rows = [r for r in lib.list_songs() if r.get("song")]
    st.markdown("**Para el bus:** descarga un único archivo con todas las canciones pasadas a limpio. Se abre en el móvil sin internet, con la melodía y el metrónomo.")
    st.download_button(
        "📲 Descargar el cancionero (sin internet)",
        lib.viewer_html([r["song"] for r in rows], embedded=False),
        file_name="cancionero-de-papa.html",
        mime="text/html",
        type="primary",
        use_container_width=True,
        disabled=not rows,
    )
    st.caption("En Android, guárdalo y ábrelo desde «Archivos» con Chrome. En iPhone, guárdalo en «Archivos» y ábrelo desde ahí.")
    st.divider()
    st.markdown("**Copia de seguridad** (incluye las fotos). Sirve para no perder nada si la app se reinicia.")
    st.download_button("⬇️ Descargar copia", lib.export_backup(), file_name="cancionero-copia.json", mime="application/json", use_container_width=True)
    up = st.file_uploader("Recuperar una copia", type=["json"], key="restore")
    if up and st.button("Recuperar"):
        try:
            n = lib.import_backup(up.getvalue().decode("utf-8"))
            flash("success", f"Recuperadas {n} canciones.")
            st.rerun()
        except Exception as e:
            st.error(f"Ese archivo no es una copia válida del cancionero ({e}).")
