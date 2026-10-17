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
                if isinstance(u.get("nd"), list) and len(u["nd"]) == len(nu["n"]) and len(nu["n"]) > 1:
                    nds = [_num(v) for v in u["nd"]]
                    if all(v and v > 0 for v in nds):
                        nu["nd"] = [round(v, 4) for v in nds]
                if isinstance(u.get("rec"), list):
                    rec = sorted({int(i) for i in u["rec"] if isinstance(i, (int, float)) and 0 <= int(i) < len(nu["n"])})
                    if rec:
                        nu["rec"] = rec
                for k in ("pos", "e", "d", "r"):
                    v = _num(u.get(k))
                    if v is not None:
                        nu[k] = round(v, 4)
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


def _num(v):
    try:
        f = float(v)
        return f if f == f else None  # descarta NaN
    except Exception:
        return None


DURATIONS = [("redonda", 4), ("blanca con puntillo", 3), ("blanca", 2), ("negra con puntillo", 1.5), ("negra", 1),
             ("corchea con puntillo", 0.75), ("corchea", 0.5), ("semicorchea", 0.25)]
DUR_LABELS = [f"{n} ({v:g})" for n, v in DURATIONS]


def dur_label(v):
    v = _num(v)
    if v is None:
        return None
    parts, left = [], v
    for n, x in DURATIONS:
        while left >= x - 1e-6:
            parts.append(n)
            left = round(left - x, 4)
    return " + ".join(parts) + f" ({v:g})" if parts and left < 1e-6 else f"{v:g} pulsos"


def dur_value(label):
    """Admite «negra (1)», «1.5», «4+1.5» o «redonda + negra con puntillo»."""
    if label is None or label == "":
        return None
    total, found = 0.0, False
    for part in re.split(r"\+", str(label)):
        part = part.strip().lower().replace(",", ".")
        if not part:
            continue
        m = re.search(r"\(([\d.]+)\)", part) or re.fullmatch(r"([\d.]+)(?:\s*pulsos?)?", part)
        if m:
            total += float(m.group(1))
            found = True
            continue
        for name, v in sorted(DURATIONS, key=lambda x: -len(x[0])):
            if part.startswith(name):
                total += v
                found = True
                break
    return round(total, 4) if found and total > 0 else None


def apply_rhythm(song: dict, result: dict) -> dict:
    """Aplica el ritmo marcado (posición exacta de cada sílaba en pulsos) a la canción."""
    song = json.loads(json.dumps(song))
    m = beats_per_bar(song.get("ts"))
    items = result.get("items") or []
    i = 0
    for sec in song.get("sections") or []:
        for line in sec.get("lines") or []:
            for u in line.get("units") or []:
                it = items[i] if i < len(items) else {}
                i += 1
                pos = _num(it.get("pos"))
                for k in ("pos", "e", "u"):
                    u.pop(k, None)
                if pos is None:
                    u.pop("b", None)
                    continue
                u["pos"] = round(pos, 4)
                e = _num(it.get("e"))
                if e is not None:
                    u["e"] = round(e, 4)
                if abs(pos - round(pos)) < 1e-6:
                    u["b"] = int(round(pos)) % m + 1
                else:
                    u.pop("b", None)
    t = _int(result.get("tempo"))
    if t:
        song["tempo"] = max(30, min(240, t))
    return normalize(song)


def slug(text: str) -> str:
    import unicodedata

    t = unicodedata.normalize("NFD", text or "cancion")
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^\w]+", "-", t).strip("-").lower()
    return t or "cancion"


# --------------------------------------------------------------------------- copia permanente en GitHub
#
# Streamlit Cloud borra los archivos nuevos al reiniciar. Si hay GITHUB_TOKEN y GITHUB_REPO,
# cada canción y cada foto se guardan también en la rama «datos» del repositorio, y al
# arrancar la app se descargan de ahí. La rama es distinta de «main» para que guardar una
# canción no reinicie la app.

GH = {"token": "", "repo": "", "branch": "datos", "shas": {}, "error": "", "last": 0.0}


def clean_repo(repo: str) -> str:
    """Acepta «usuario/repo», la dirección web completa o la de clonar (.git)."""
    r = (repo or "").strip().strip('"').strip("'")
    r = re.sub(r"^(https?://)?(www\.)?github\.com/", "", r)
    r = re.sub(r"\.git$", "", r).strip("/")
    parts = r.split("/")
    return "/".join(parts[:2]) if len(parts) >= 2 else r


def gh_enabled() -> bool:
    return bool(GH["token"] and GH["repo"])


def _gh(method: str, path: str, **kw):
    import requests

    r = requests.request(
        method,
        f"https://api.github.com/repos/{GH['repo']}{path}",
        headers={"Authorization": f"Bearer {GH['token']}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"},
        timeout=30,
        **kw,
    )
    return r


def _gh_fail(r, what: str) -> str:
    try:
        detail = (r.json() or {}).get("message", "")
    except Exception:
        detail = ""
    if r.status_code == 401:
        return f"GitHub no acepta el token al {what} (puede estar mal copiado o caducado). Crea uno nuevo y ponlo en GITHUB_TOKEN. [{detail}]"
    if r.status_code == 403:
        return f"El token no tiene permiso para {what}: en GitHub, edita el token y pon «Contents: Read and write» para el repositorio «{GH['repo']}». [{detail}]"
    if r.status_code == 404:
        return f"GitHub no encuentra «{GH['repo']}» al {what}. GITHUB_REPO debe ser exactamente usuario/nombre (por ejemplo djimenezperso/cancionerodepapa) y el token debe tener acceso a ese repositorio. [{detail}]"
    return f"GitHub ha fallado al {what} (error {r.status_code}). [{detail}]"


def _blob_sha(data: bytes) -> str:
    import hashlib

    return hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()


def gh_sync(token: str, repo: str) -> str:
    """Prepara GitHub y trae a la carpeta local las canciones guardadas. Devuelve '' o un aviso."""
    GH.update(token=token.strip(), repo=clean_repo(repo), error="")
    if not gh_enabled():
        return ""
    try:
        r = _gh("GET", f"/git/trees/{GH['branch']}?recursive=1")
        if r.status_code == 404:  # la rama «datos» aún no existe: se crea a partir de main con las canciones actuales
            info = _gh("GET", "")
            if info.status_code != 200:
                raise RuntimeError(_gh_fail(info, "leer el repositorio"))
            base = info.json().get("default_branch", "main")
            ref = _gh("GET", f"/git/ref/heads/{base}")
            if ref.status_code != 200:
                raise RuntimeError(_gh_fail(ref, "leer la rama principal"))
            mk = _gh("POST", "/git/refs", json={"ref": f"refs/heads/{GH['branch']}", "sha": ref.json()["object"]["sha"]})
            if mk.status_code not in (200, 201):
                raise RuntimeError(_gh_fail(mk, "crear la rama de datos"))
            r = _gh("GET", f"/git/trees/{GH['branch']}?recursive=1")
        if r.status_code != 200:
            raise RuntimeError(_gh_fail(r, "leer las canciones"))
        remote = {t["path"]: t["sha"] for t in r.json().get("tree", []) if t.get("type") == "blob" and t["path"].startswith("songs/")}
        GH["shas"] = dict(remote)
        for path, sha in remote.items():
            f = ROOT / path
            if f.exists() and _blob_sha(f.read_bytes()) == sha:
                continue
            b = _gh("GET", f"/git/blobs/{sha}")
            if b.status_code != 200:
                continue
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_bytes(base64.b64decode(b.json()["content"]))
        # lo que se borró en GitHub se borra también aquí
        for f in list(SONGS.glob("*.json")) + list(PHOTOS.glob("*")):
            rel = f.relative_to(ROOT).as_posix()
            if rel not in remote:
                f.unlink()
        GH["last"] = time.time()
        return ""
    except Exception as e:
        GH["error"] = str(e)
        return str(e)


def _gh_put(rel: str, data: bytes, msg: str) -> None:
    if not gh_enabled():
        return
    body = {"message": msg, "content": base64.b64encode(data).decode(), "branch": GH["branch"]}
    if rel in GH["shas"]:
        body["sha"] = GH["shas"][rel]
    r = _gh("PUT", f"/contents/{rel}", json=body)
    if r.status_code in (409, 422):  # sha desactualizado: se pide el actual y se reintenta una vez
        cur = _gh("GET", f"/contents/{rel}?ref={GH['branch']}")
        if cur.status_code == 200:
            body["sha"] = cur.json()["sha"]
        else:
            body.pop("sha", None)
        r = _gh("PUT", f"/contents/{rel}", json=body)
    if r.status_code not in (200, 201):
        raise RuntimeError(_gh_fail(r, "guardar"))
    GH["shas"][rel] = r.json()["content"]["sha"]


def _gh_delete(rel: str) -> None:
    if not gh_enabled() or rel not in GH["shas"]:
        return
    r = _gh("DELETE", f"/contents/{rel}", json={"message": f"Borrar {rel}", "sha": GH["shas"][rel], "branch": GH["branch"]})
    if r.status_code not in (200, 404):
        raise RuntimeError(_gh_fail(r, "borrar"))
    GH["shas"].pop(rel, None)


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
    raw = json.dumps(data, ensure_ascii=False, indent=1).encode("utf-8")
    (SONGS / f"{song_id}.json").write_bytes(raw)
    # fotos que aún no estén en GitHub (por ejemplo, guardadas antes de configurar el token)
    for ph in data.get("photos") or []:
        if gh_enabled() and ph not in GH["shas"] and (ROOT / ph).exists():
            _gh_put(ph, (ROOT / ph).read_bytes(), f"Foto de {data.get('title', '')}")
    _gh_put(f"songs/{song_id}.json", raw, f"Guardar «{data.get('title', '')}»")
    return song_id


def delete_song(song_id: str) -> None:
    row = get_song(song_id)
    if row:
        for ph in row.get("photos") or []:
            f = ROOT / ph
            if f.parent == PHOTOS:
                f.unlink(missing_ok=True)
                _gh_delete(ph)
    (SONGS / f"{song_id}.json").unlink(missing_ok=True)
    _gh_delete(f"songs/{song_id}.json")


def store_photos(images: list[bytes], base: str) -> list[str]:
    paths = []
    for i, raw in enumerate(images, 1):
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
        im.thumbnail((1800, 1800))
        name = f"{slug(base)}-{uuid.uuid4().hex[:5]}_{i}.jpg"
        im.save(PHOTOS / name, quality=85)
        rel = f"songs/photos/{name}"
        paths.append(rel)
        _gh_put(rel, (PHOTOS / name).read_bytes(), f"Foto {name}")
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
- OJO CON SU LETRA: en su escritura "Fa" y "La" se parecen mucho (la F mayúscula manuscrita puede parecer una L), y también "Sol" y "Si", o "Mi" y "Mib" si el bemol es pequeño. Fíjate en la raya horizontal de arriba de la F. Si dudas, decide por la melodía (lo normal es que las notas vayan por pasos cortos, sin saltos raros) y, si reconoces la canción, por cómo es la melodía de verdad. Anota en "doubts" las que no tengas claras.
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
- TIEMPOS Y ANACRUSA: si la hoja trae números de tiempo, respétalos tal cual. Si en algún verso NO hay números, propón tú "b" en las sílabas que caen en tiempo, colocando el tiempo 1 (el golpe fuerte) en la sílaba acentuada de la frase. Muchas canciones empiezan en ANACRUSA: las primeras sílabas van antes del primer tiempo fuerte (por ejemplo, en "and I love you so" el 1 cae en "love" o en "so", no en "and"), así que esas sílabas iniciales llevan tiempos como 3 o 4 del compás anterior. Si reconoces la canción, usa cómo se canta de verdad para decidir dónde cae el 1.
- DURACIONES: en cada unidad con nota pon "d" = cuánto dura, en pulsos (negra = 1, corchea = 0.5, semicorchea = 0.25, negra con puntillo = 1.5, blanca = 2, blanca con puntillo = 3, redonda = 4; en compases de 6/8 o 12/8 el pulso es la corchea). Tienen que cuadrar con los números de tiempo: sumando las duraciones desde una sílaba con número, la siguiente sílaba con número debe caer exactamente en su tiempo. Si la nota se aguanta ("4-1"), su "d" lo incluye. Si después de una sílaba hay un silencio o respiración antes de la siguiente frase, pon "r" = duración del silencio en pulsos. Si reconoces la canción, usa su ritmo real.
- "tempo": negras por minuto aproximadas (si reconoces la canción, su velocidad habitual; si no, 80).
- "doubts": lista corta de cosas que no se leían bien (ejemplo: "verso 3: ¿Sib o Si?"). Vacía si todo está claro.

Responde solo con JSON con esta forma:
{"title":"...","page":"4","ts":"4/4","tempo":72,"general":["..."],"doubts":["..."],
 "sections":[{"label":"","lines":[{"cues":["No perder metal"],"units":[{"t":"My","n":["Lab"],"b":4,"d":1},{"t":"emp-","n":["Sib","Re#"],"b":1,"d":1},{"t":"ty","n":[],"d":1},{"t":"arms","n":["Re#"],"b":3,"u":1,"mark":true,"d":3,"r":1}]}]}]}"""


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


def read_sheet(images: list[bytes], api_key: str, model: str, title_hint: str = "", provider: str = "anthropic") -> tuple[dict, list[str]]:
    """Envía las fotos al modelo elegido (Claude u OpenAI) y devuelve (canción, dudas)."""
    if provider == "openai":
        return _read_openai(images, api_key, model, title_hint)
    return _read_anthropic(images, api_key, model, title_hint)


def _finish(text: str, cut: bool, title_hint: str) -> tuple[dict, list[str]]:
    try:
        data = _parse_json(text)
    except Exception as e:
        extra = " La respuesta salió cortada; prueba con menos fotos a la vez." if cut else ""
        raise ReadError("No se ha podido entender la respuesta." + extra) from e
    doubts = [str(d) for d in (data.get("doubts") or []) if str(d).strip()]
    song = normalize(data)
    if title_hint and (not song["title"] or song["title"] == "Sin título"):
        song["title"] = title_hint
    return song, doubts


REFUSED = (
    "El modelo no ha transcrito esta hoja (a veces pasa con letras de canciones conocidas). "
    "Puedes escribir la letra a mano en «Nueva canción» y corregir las notas en la tabla."
)


def _read_openai(images: list[bytes], api_key: str, model: str, title_hint: str) -> tuple[dict, list[str]]:
    import openai

    client = openai.OpenAI(api_key=api_key)
    prompt = PROMPT + (f"\n\nEl título de la canción es: {title_hint}" if title_hint else "")
    content = [{"type": "text", "text": prompt}] + [
        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + _jpeg_b64(r, 2048), "detail": "high"}} for r in images
    ]
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": content}],
            response_format={"type": "json_object"},
            max_completion_tokens=16000,
        )
    except openai.AuthenticationError as e:
        raise ReadError("La clave de OpenAI no es válida. Revísala en la barra lateral o en los Secrets.") from e
    except openai.RateLimitError as e:
        raise ReadError("OpenAI dice que no hay saldo o que has llegado al límite. Revisa tu cuenta en platform.openai.com.") from e
    except openai.NotFoundError as e:
        raise ReadError(f"El modelo «{model}» no está disponible para esta clave. Elige otro en la barra lateral.") from e
    except openai.BadRequestError as e:
        raise ReadError(f"OpenAI no ha aceptado la petición con el modelo «{model}». Prueba con otro modelo. Detalle: {e}") from e
    except openai.APIError as e:
        raise ReadError(f"OpenAI ha devuelto un error: {e}") from e
    choice = resp.choices[0]
    if getattr(choice.message, "refusal", None) or not (choice.message.content or "").strip():
        raise ReadError(REFUSED)
    return _finish(choice.message.content, choice.finish_reason == "length", title_hint)


def _read_anthropic(images: list[bytes], api_key: str, model: str, title_hint: str) -> tuple[dict, list[str]]:
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
        raise ReadError(REFUSED)
    return _finish(text, msg.stop_reason == "max_tokens", title_hint)


RHYTHM_PROMPT = """Esta es una canción de una hoja de estudio de canto, ya pasada a datos. Cada sílaba tiene sus notas ("n") y, a veces, el tiempo del compás donde cae ("b", del 1 al número de tiempos del compás) y hasta qué tiempo se aguanta ("u").

Propón el RITMO: para cada sílaba, en el mismo orden, "d" = duración en pulsos (negra = 1, corchea = 0.5, semicorchea = 0.25, negra con puntillo = 1.5, blanca = 2, blanca con puntillo = 3, redonda = 4; en 6/8 o 12/8 el pulso es la corchea) y "r" = silencio después en pulsos (0 si no hay).

Reglas:
- Respeta los números de tiempo: sumando duraciones y silencios desde una sílaba con "b", la siguiente sílaba con "b" debe caer exactamente en su tiempo.
- La canción puede empezar en anacrusa (antes del tiempo 1).
- Las sílabas sin nota también llevan duración.
- Si reconoces la canción por el título, usa su ritmo real.

Responde solo con JSON: {"units":[{"d":1,"r":0}, ...]} con exactamente %d elementos.

Compás: %s
Título: %s
Sílabas:
%s"""


def _complete_text(prompt: str, api_key: str, model: str, provider: str) -> str:
    if provider == "openai":
        import openai

        client = openai.OpenAI(api_key=api_key)
        try:
            r = client.chat.completions.create(model=model, messages=[{"role": "user", "content": prompt}], response_format={"type": "json_object"}, max_completion_tokens=8000)
        except openai.APIError as e:
            raise ReadError(f"OpenAI ha devuelto un error: {e}") from e
        return r.choices[0].message.content or ""
    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    try:
        r = client.messages.create(model=model, max_tokens=8000, messages=[{"role": "user", "content": prompt}])
    except anthropic.APIError as e:
        raise ReadError(f"La API ha devuelto un error: {e}") from e
    return "".join(getattr(b, "text", "") for b in r.content)


def estimate_rhythm(song: dict, api_key: str, model: str, provider: str) -> dict:
    """Pide a la IA la duración de cada sílaba (sin foto) y la guarda en la canción."""
    flat = [u for sec in song.get("sections", []) for line in sec.get("lines", []) for u in line.get("units", [])]
    if not flat:
        raise ReadError("La canción no tiene sílabas.")
    lines = []
    for i, u in enumerate(flat, 1):
        extra = (f" tiempo {u['b']}" if u.get("b") else "") + (f" hasta {u['u']}" if u.get("u") else "")
        lines.append(f"{i}. «{u.get('t', '')}» notas: {'-'.join(u.get('n') or []) or '—'}{extra}")
    text = _complete_text(RHYTHM_PROMPT % (len(flat), song.get("ts", "4/4"), song.get("title", ""), "\n".join(lines)), api_key, model, provider)
    try:
        data = _parse_json(text)
        units = data["units"] if isinstance(data, dict) else data
    except Exception as e:
        raise ReadError("No se ha podido entender la respuesta. Prueba otra vez.") from e
    if len(units) != len(flat):
        raise ReadError(f"La IA devolvió {len(units)} duraciones para {len(flat)} sílabas. Prueba otra vez.")
    new = json.loads(json.dumps(song))
    i = 0
    for sec in new.get("sections", []):
        for line in sec.get("lines", []):
            for u in line.get("units", []):
                d, r = _num(units[i].get("d")), _num(units[i].get("r"))
                u.pop("pos", None)
                u.pop("e", None)
                if d and d > 0:
                    u["d"] = d
                if r and r > 0:
                    u["r"] = r
                else:
                    u.pop("r", None)
                i += 1
    return normalize(new)


VOICE_PROMPT = """Eres el ayudante de un cancionero de canto. Abajo está la canción, sílaba a sílaba, numerada, con su nota, el tiempo del compás donde cae, su duración en pulsos y el silencio que va detrás. Después viene lo que la persona ha dicho en voz alta para corregirla.

Convierte lo que ha dicho en cambios concretos:
- Identifica cada sílaba por su texto y su posición (si una palabra se repite, usa el contexto: "la segunda vez que dice love", "en el estribillo"...).
- Notas en solfeo: Do, Re, Mi, Fa, Sol, La, Si, con # (sostenido) o b (bemol); número de octava solo si lo dice ("Re 4" → "Re4").
- Duraciones en pulsos: redonda 4, blanca con puntillo 3, blanca 2, negra con puntillo 1.5, negra 1, corchea con puntillo 0.75, corchea 0.5, semicorchea 0.25, tresillo de corcheas 1/3 cada una. "Ligada a" o "más" suma: "redonda ligada a negra con puntillo" = 5.5.
- "Silencio de negra después" → "r": 1. Tiempo del compás → "b".
- Si dice algo como "de love a so todas negras", aplica a todas las sílabas de ese tramo.
- No cambies nada que no haya pedido.

Responde solo con JSON:
{"cambios":[{"i":numero_de_silaba,"n":["Fa"],"d":5.5,"r":0,"b":1,"t":"texto"}],"resumen":["frase corta por cada cambio, en español"],"no_entendido":"lo que no hayas podido aplicar, o vacío"}
Incluye en cada cambio solo los campos que cambian.

Compás: %s
Canción:
%s

Lo que ha dicho:
«%s»"""


def transcribe_voice(audio: bytes, api_key: str, filename: str = "voz.wav") -> str:
    import openai

    client = openai.OpenAI(api_key=api_key)
    last = None
    for model in ("gpt-4o-transcribe", "whisper-1"):
        try:
            r = client.audio.transcriptions.create(model=model, file=(filename, audio), language="es")
            return (r.text or "").strip()
        except openai.APIError as e:
            last = e
    raise ReadError(f"No se ha podido pasar la voz a texto: {last}")


def voice_changes(song: dict, said: str, api_key: str, model: str, provider: str) -> tuple[dict, list[str], str]:
    """Interpreta las correcciones dichas en voz alta. Devuelve (canción nueva, resumen, lo no entendido)."""
    flat = [u for sec in song.get("sections", []) for line in sec.get("lines", []) for u in line.get("units", [])]
    rows = []
    for i, u in enumerate(flat, 1):
        rows.append(
            f"{i}. «{u.get('t', '')}» nota: {'-'.join(u.get('n') or []) or '—'}"
            f" | tiempo: {u.get('b', '—')} | duración: {u.get('d', '—')} | silencio: {u.get('r', 0)}"
        )
    text = _complete_text(VOICE_PROMPT % (song.get("ts", "4/4"), "\n".join(rows), said), api_key, model, provider)
    try:
        data = _parse_json(text)
    except Exception as e:
        raise ReadError("No he entendido la respuesta. Prueba a decirlo otra vez.") from e
    new = json.loads(json.dumps(song))
    nflat = [u for sec in new.get("sections", []) for line in sec.get("lines", []) for u in line.get("units", [])]
    for c in data.get("cambios") or []:
        i = _int(c.get("i"))
        if not i or not (1 <= i <= len(nflat)):
            continue
        u = nflat[i - 1]
        if isinstance(c.get("n"), list):
            u["n"] = [str(x).strip() for x in c["n"] if str(x).strip()]
        elif isinstance(c.get("n"), str) and c["n"].strip():
            u["n"] = [x.strip() for x in re.split(r"\s*[-–]\s*", c["n"]) if x.strip()]
        for k in ("d", "r"):
            v = _num(c.get(k))
            if v is not None:
                if v > 0:
                    u[k] = v
                else:
                    u.pop(k, None)
        b = _int(c.get("b"))
        if b:
            u["b"] = b
        if isinstance(c.get("t"), str) and c["t"].strip():
            u["t"] = c["t"]
        u.pop("pos", None)
        u.pop("e", None)
    summary = [str(x) for x in data.get("resumen") or [] if str(x).strip()]
    return normalize(new), summary, str(data.get("no_entendido") or "").strip()


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
                        "duración": dur_label(u.get("d")),
                        "silencio": u.get("r"),
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
                "d": dur_value(clean(r.get("duración"))),
                "r": _num(clean(r.get("silencio"))),
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
    core = (ASSETS / "core.js").read_text("utf-8") + "\n" + (ASSETS / "score.js").read_text("utf-8")
    return (ASSETS / "core.css").read_text("utf-8"), core, (ASSETS / "viewer.js").read_text("utf-8")


def visor_assets() -> tuple[str, str]:
    css, core, viewer = _assets()
    return css, core + "\n" + viewer


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
