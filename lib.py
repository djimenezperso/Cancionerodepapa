"""Lógica del cancionero: guardar canciones, leer fotos con Claude y generar el visor."""
from __future__ import annotations

import base64
import io
import json
import re
import time
import uuid
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).parent
SONGS = ROOT / "songs"
PHOTOS = SONGS / "photos"
ASSETS = ROOT / "assets"
SONGS.mkdir(exist_ok=True)
PHOTOS.mkdir(exist_ok=True)

TIME_SIGNATURES = ["2/4", "3/4", "4/4", "6/8", "12/8"]

# --------------------------------------------------------------------------- datos


def beats_per_bar(ts: str) -> int:
    try:
        n = int(str(ts).split("/")[0])
        return n if 0 < n <= 12 else 4
    except Exception:
        return 4


def normalize(x: dict | None) -> dict:
    """Deja la canción en un formato limpio, sea cual sea lo que devuelva Claude."""
    x = x or {}
    ts = str(x.get("ts") or "").strip()
    if ts not in TIME_SIGNATURES:
        ts = "4/4"
    try:
        tempo = max(30, min(240, int(float(x.get("tempo") or 80))))
    except Exception:
        tempo = 80
    song = {
        "title": str(x.get("title") or "Sin título").strip(),
        "ts": ts,
        "tempo": tempo,
        "page": str(x.get("page") or "").strip(),
        "general": [str(g).strip() for g in (x.get("general") or []) if str(g).strip()],
        "sections": [],
    }
    m = beats_per_bar(ts)
    for sec in x.get("sections") or []:
        ns = {"label": str((sec or {}).get("label") or "").strip(), "lines": []}
        for line in (sec or {}).get("lines") or []:
            nl = {"cues": [str(c).strip() for c in (line or {}).get("cues") or [] if str(c).strip()], "units": []}
            for u in (line or {}).get("units") or []:
                if not isinstance(u, dict):
                    continue
                notes = u.get("n") or []
                if isinstance(notes, str):
                    notes = re.split(r"\s*[-–]\s*", notes)
                nu = {"t": str(u.get("t") or "").rstrip(), "n": [str(v).strip() for v in notes if str(v).strip()]}
                b = _int(u.get("b"))
                if b and 1 <= b <= m:
                    nu["b"] = b
                    uu = _int(u.get("u"))
                    if uu and 1 <= uu <= m:
                        nu["u"] = uu
                for k in ("mark", "acc", "pause"):
                    if u.get(k):
                        nu[k] = True
                if u.get("x"):
                    nu["x"] = str(u["x"])[:4]
                if nu["t"] or nu["n"]:
                    nl["units"].append(nu)
            if nl["units"] or nl["cues"]:
                ns["lines"].append(nl)
        if ns["lines"]:
            song["sections"].append(ns)
    return song


def _int(v):
    try:
        return int(v)
    except Exception:
        return None


def slug(text: str) -> str:
    import unicodedata

    t = unicodedata.normalize("NFD", text or "cancion")
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^\w]+", "-", t).strip("-").lower()
    return t or "cancion"


# --------------------------------------------------------------------------- almacenamiento


def list_songs() -> list[dict]:
    rows = []
    for p in SONGS.glob("*.json"):
        try:
            d = json.loads(p.read_text("utf-8"))
            d["id"] = p.stem
            rows.append(d)
        except Exception:
            continue
    rows.sort(key=lambda r: (r.get("title") or "").lower())
    return rows


def get_song(song_id: str) -> dict | None:
    p = SONGS / f"{song_id}.json"
    if not p.exists():
        return None
    d = json.loads(p.read_text("utf-8"))
    d["id"] = song_id
    return d


def save_song(row: dict, song_id: str | None = None) -> str:
    if not song_id:
        song_id = f"{slug(row.get('title', ''))}-{uuid.uuid4().hex[:5]}"
    data = {k: v for k, v in row.items() if k != "id"}
    data["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    (SONGS / f"{song_id}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), "utf-8")
    return song_id


def delete_song(song_id: str) -> None:
    row = get_song(song_id)
    if row:
        for ph in row.get("photos") or []:
            f = ROOT / ph
            if f.exists() and f.parent == PHOTOS:
                f.unlink()
    (SONGS / f"{song_id}.json").unlink(missing_ok=True)


def store_photos(images: list[bytes], base: str) -> list[str]:
    paths = []
    for i, raw in enumerate(images, 1):
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
        im.thumbnail((1800, 1800))
        name = f"{slug(base)}-{uuid.uuid4().hex[:5]}_{i}.jpg"
        im.save(PHOTOS / name, quality=85)
        paths.append(f"songs/photos/{name}")
    return paths


def photo_bytes(rel: str) -> bytes | None:
    f = ROOT / rel
    return f.read_bytes() if f.exists() else None


def export_backup() -> str:
    """Copia de seguridad con todo (fotos incluidas en base64)."""
    out = []
    for r in list_songs():
        r = dict(r)
        r["photos_b64"] = [base64.b64encode(photo_bytes(p) or b"").decode() for p in r.get("photos") or []]
        out.append(r)
    return json.dumps(out, ensure_ascii=False)


def import_backup(text: str) -> int:
    n = 0
    for r in json.loads(text):
        imgs = [base64.b64decode(b) for b in r.pop("photos_b64", []) if b]
        r["photos"] = store_photos(imgs, r.get("title", "cancion")) if imgs else []
        sid = r.pop("id", None)
        if sid and get_song(sid):
            sid = None
        save_song(r, sid)
        n += 1
    return n


# --------------------------------------------------------------------------- Claude

PROMPT = """Las imágenes son fotos (en orden) de una hoja de estudio de canto escrita a mano por un cantante para su práctica personal. Pásala a datos estructurados respetando su notación.

CÓMO ESCRIBE ÉL:
- Encima de cada sílaba, en rojo, la NOTA de la melodía en solfeo: Do, Re, Mi, Fa, Sol, La, Si, con # o b (Sib = Si bemol, Mib = Mi bemol). Un número pegado a la nota (Re4, Do#4) es la octava: cópialo. Si no lleva número, no lo inventes.
- Dos notas unidas con guion sobre una misma sílaba ("Sib-Re#", "La-La", "Sol-Sol") son varias notas en esa sílaba: van juntas en la lista "n" de esa sílaba.
- Números de colores (azul y verde, del 1 al 4 normalmente) delante de una nota = el TIEMPO del compás en el que cae esa nota → campo "b". "4-1" detrás de una nota = se aguanta hasta el tiempo 1 → "u":1. Una secuencia como "1 Do4 2 3 4 1 2" = la nota empieza en 1 y se aguanta hasta el último número → "b":1,"u":2. Una raya larga con un número encima que abarca varias notas indica que esas notas entran dentro de ese tiempo: pon el número solo en la primera.
- Notas resaltadas en amarillo → "mark": true.
- Palabra subrayada o con flecha debajo → "acc": true.
- Un punto gordo entre dos palabras → "pause": true en la palabra anterior.
- Un número dentro de un círculo junto a una nota (por ejemplo ②) → "x": "2".
- Palabras sueltas en otros colores o en grande ("metal", "no perder metal", "reír", "sonreír", "morritos", "lengua", "paladearlo", "cuello", "ternura", "buscar el hueco en el cuello"…) son APUNTES DE TÉCNICA: ponlos tal cual en "cues" del verso más cercano. Los apuntes grandes al pie de la hoja van en "general".
- Indicaciones como "1234-123" junto al título o a un verso son pistas del compás.
- Ignora lo tachado y lo tapado con cinta. El número suelto de la esquina superior es el número de hoja → "page".

CÓMO DEVOLVERLO:
- Cada verso (renglón cantado) es una línea. Si en un renglón hay dos frases una al lado de otra, van en la misma línea, de izquierda a derecha.
- Cada línea se divide en "units": una por cada palabra, o por cada sílaba cuando dentro de una palabra hay varias notas en sílabas distintas (termina la sílaba con guion: "e-", "ter-", "ni-", "ty"). Cada unidad lleva solo las notas escritas encima de ella; si una palabra no tiene nota encima, "n": [].
- Escribe la letra en minúsculas normales (mayúscula solo al principio del verso y en nombres), tal y como está escrita, sin corregirla ni traducirla.
- "ts": el compás ("2/4", "3/4", "4/4", "6/8" o "12/8"). Dedúcelo del número de tiempo más alto que use y de las pistas de la hoja; si reconoces la canción por el título, úsalo para confirmarlo.
- "tempo": negras por minuto aproximadas (si reconoces la canción, su velocidad habitual; si no, 80).
- "doubts": lista corta de cosas que no se leían bien (ejemplo: "verso 3: ¿Sib o Si?"). Vacía si todo está claro.

Responde solo con JSON con esta forma:
{"title":"...","page":"4","ts":"4/4","tempo":72,"general":["..."],"doubts":["..."],
 "sections":[{"label":"","lines":[{"cues":["No perder metal"],"units":[{"t":"My","n":["Lab"],"b":4},{"t":"emp-","n":["Sib","Re#"],"b":1},{"t":"ty","n":[]},{"t":"arms","n":["Re#"],"b":3,"u":1,"mark":true}]}]}]}"""


class ReadError(Exception):
    pass


def _jpeg_b64(raw: bytes, max_side: int = 1568) -> str:
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
    im.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=88)
    return base64.b64encode(buf.getvalue()).decode()


def _parse_json(text: str):
    t = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", t)
    if fence:
        t = fence.group(1).strip()
    try:
        return json.loads(t)
    except Exception:
        a, b = t.find("{"), t.rfind("}")
        if a >= 0 and b > a:
            return json.loads(t[a : b + 1])
        raise


def read_sheet(images: list[bytes], api_key: str, model: str, title_hint: str = "") -> tuple[dict, list[str]]:
    """Envía las fotos a Claude y devuelve (canción, dudas)."""
    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    content = [{"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": _jpeg_b64(r)}} for r in images]
    prompt = PROMPT + (f"\n\nEl título de la canción es: {title_hint}" if title_hint else "")
    content.append({"type": "text", "text": prompt})
    try:
        msg = client.messages.create(model=model, max_tokens=12000, messages=[{"role": "user", "content": content}])
    except anthropic.AuthenticationError as e:
        raise ReadError("La clave de la API no es válida. Revísala en la barra lateral.") from e
    except anthropic.RateLimitError as e:
        raise ReadError("Has llegado al límite de uso de la API por ahora. Prueba en un rato.") from e
    except anthropic.NotFoundError as e:
        raise ReadError(f"El modelo «{model}» no está disponible para esta clave. Elige otro en la barra lateral.") from e
    except anthropic.APIError as e:
        raise ReadError(f"La API ha devuelto un error: {e}") from e
    text = "".join(getattr(b, "text", "") for b in msg.content)
    if msg.stop_reason == "refusal" or not text.strip():
        raise ReadError(
            "Claude no ha transcrito esta hoja (a veces pasa con letras de canciones conocidas). "
            "Puedes escribir la letra a mano en «Nueva canción» y corregir las notas en la tabla."
        )
    try:
        data = _parse_json(text)
    except Exception as e:
        cut = " La respuesta salió cortada; prueba con menos fotos a la vez." if msg.stop_reason == "max_tokens" else ""
        raise ReadError("No se ha podido entender la respuesta." + cut) from e
    doubts = [str(d) for d in (data.get("doubts") or []) if str(d).strip()]
    song = normalize(data)
    if title_hint and (not song["title"] or song["title"] == "Sin título"):
        song["title"] = title_hint
    return song, doubts


def song_from_text(title: str, ts: str, lyrics: str) -> dict:
    sections, cur = [], None
    for line in lyrics.splitlines():
        if not line.strip():
            cur = None
            continue
        if cur is None:
            cur = {"label": "", "lines": []}
            sections.append(cur)
        cur["lines"].append({"cues": [], "units": [{"t": w, "n": []} for w in line.split()]})
    return normalize({"title": title or "Nueva canción", "ts": ts, "tempo": 80, "sections": sections})


# --------------------------------------------------------------------------- tabla de corrección


def song_to_rows(song: dict) -> tuple[list[dict], list[dict]]:
    units, lines = [], []
    v = 0
    for si, sec in enumerate(song.get("sections") or []):
        for line in sec.get("lines") or []:
            v += 1
            lines.append({"verso": v, "parte": sec.get("label", "") if line is sec["lines"][0] else "", "apuntes": " / ".join(line.get("cues") or [])})
            for u in line.get("units") or []:
                units.append(
                    {
                        "verso": v,
                        "sílaba": u.get("t", ""),
                        "notas": " - ".join(u.get("n") or []),
                        "tiempo": u.get("b"),
                        "hasta": u.get("u"),
                        "amarillo": bool(u.get("mark")),
                        "subrayado": bool(u.get("acc")),
                        "pausa": bool(u.get("pause")),
                        "círculo": u.get("x", ""),
                    }
                )
    return units, lines


def rows_to_song(meta: dict, units: list[dict], lines: list[dict]) -> dict:
    def clean(v):
        if v is None:
            return None
        try:
            if v != v:  # NaN
                return None
        except Exception:
            pass
        return v

    by_verse: dict[int, list] = {}
    order: list[int] = []
    for r in units:
        v = _int(clean(r.get("verso")))
        if v is None:
            continue
        if v not in by_verse:
            by_verse[v] = []
            order.append(v)
        by_verse[v].append(
            {
                "t": str(clean(r.get("sílaba")) or ""),
                "n": [n for n in re.split(r"\s*[-–]\s*", str(clean(r.get("notas")) or "")) if n.strip()],
                "b": _int(clean(r.get("tiempo"))),
                "u": _int(clean(r.get("hasta"))),
                "mark": bool(clean(r.get("amarillo"))),
                "acc": bool(clean(r.get("subrayado"))),
                "pause": bool(clean(r.get("pausa"))),
                "x": str(clean(r.get("círculo")) or ""),
            }
        )
    info = {}
    for r in lines:
        v = _int(clean(r.get("verso")))
        if v is not None:
            info[v] = r
            if v not in by_verse:
                by_verse[v] = []
                order.append(v)
    sections, cur = [], None
    for v in sorted(order):
        li = info.get(v, {})
        label = str(clean(li.get("parte")) or "").strip()
        if cur is None or label:
            cur = {"label": label, "lines": []}
            sections.append(cur)
        cues = [c.strip() for c in str(clean(li.get("apuntes")) or "").split("/") if c.strip()]
        cur["lines"].append({"cues": cues, "units": by_verse[v]})
    return normalize({**meta, "sections": sections})


# --------------------------------------------------------------------------- visor HTML


def _assets():
    return (ASSETS / "core.css").read_text("utf-8"), (ASSETS / "core.js").read_text("utf-8"), (ASSETS / "viewer.js").read_text("utf-8")


FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Kalam:wght@400;700&display=swap">'


def viewer_html(songs: list[dict], title: str = "Cancionero de Papá", embedded: bool = True) -> str:
    css, core, viewer = _assets()
    data = json.dumps(songs, ensure_ascii=False).replace("<", "\\u003c")
    flag = "true" if embedded else "false"
    return (
        '<!doctype html><html lang="es"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        f"<title>{title}</title>{FONTS}<style>{css}</style></head><body><div id=\"app\"></div>"
        f"<script>window.SONGS={data};window.EMBEDDED={flag};</script><script>{core}</script><script>{viewer}</script></body></html>"
    )


EXAMPLE = normalize(
    {
        "title": "Cumpleaños feliz",
        "ts": "3/4",
        "tempo": 96,
        "general": ["Soltar mandíbula", "Sonreír al final"],
        "sections": [
            {
                "label": "",
                "lines": [
                    {"cues": ["Sonreír"], "units": [{"t": "Cum-", "n": ["Sol"], "b": 3, "mark": True}, {"t": "ple-", "n": ["Sol"], "mark": True}, {"t": "a-", "n": ["La"], "b": 1}, {"t": "ños", "n": ["Sol"], "b": 2}, {"t": "fe-", "n": ["Do4"], "b": 3}, {"t": "liz,", "n": ["Si"], "b": 1, "u": 2, "pause": True}]},
                    {"cues": [], "units": [{"t": "te", "n": ["Sol"], "b": 3, "mark": True}, {"t": "de-", "n": ["Sol"], "mark": True}, {"t": "sea-", "n": ["La"], "b": 1}, {"t": "mos", "n": ["Sol"], "b": 2}, {"t": "a", "n": ["Re4"], "b": 3}, {"t": "ti,", "n": ["Do4"], "b": 1, "u": 2, "pause": True}]},
                    {"cues": ["No perder metal"], "units": [{"t": "cum-", "n": ["Sol"], "b": 3}, {"t": "plea-", "n": ["Sol"]}, {"t": "ños,", "n": ["Sol4"], "b": 1, "acc": True}, {"t": "a-", "n": ["Mi4"], "b": 2}, {"t": "bue-", "n": ["Do4"], "b": 3}, {"t": "lo,", "n": ["Si", "La"], "b": 1, "u": 2, "pause": True}]},
                    {"cues": [], "units": [{"t": "cum-", "n": ["Fa4"], "b": 3, "mark": True}, {"t": "ple-", "n": ["Fa4"], "mark": True}, {"t": "a-", "n": ["Mi4"], "b": 1}, {"t": "ños", "n": ["Do4"], "b": 2}, {"t": "fe-", "n": ["Re4"], "b": 3}, {"t": "liz.", "n": ["Do4"], "b": 1, "u": 3}]},
                ],
            }
        ],
    }
)
