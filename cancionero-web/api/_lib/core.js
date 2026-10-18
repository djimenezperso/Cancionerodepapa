// Utilidades del servidor: clave de acceso, GitHub (rama «datos») y OpenAI.
const BRANCH = "datos";
const TIME_SIGNATURES = ["2/4", "3/4", "4/4", "6/8", "12/8"];

class HttpError extends Error {
  constructor(status, msg) { super(msg); this.status = status; }
}

function cleanRepo(repo) {
  let r = String(repo || "").trim().replace(/^["']|["']$/g, "");
  r = r.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "").replace(/\.git$/, "").replace(/^\/+|\/+$/g, "");
  const parts = r.split("/");
  return parts.length >= 2 ? parts.slice(0, 2).join("/") : r;
}

const CFG = () => ({
  password: process.env.APP_PASSWORD || "",
  token: (process.env.GITHUB_TOKEN || "").trim(),
  repo: cleanRepo(process.env.GITHUB_REPO),
  openai: (process.env.OPENAI_API_KEY || "").trim(),
  model: (process.env.OPENAI_MODEL || "gpt-5").trim(),
});

// ---------------------------------------------------------------- envoltorio de cada función
function handler(fn) {
  return async (req, res) => {
    try {
      const c = CFG();
      if (!c.password) throw new HttpError(500, "Falta APP_PASSWORD en Vercel (Settings → Environment Variables).");
      const given = req.headers["x-clave"] || "";
      if (decodeURIComponent(given) !== c.password) throw new HttpError(401, "Contraseña incorrecta.");
      const out = await fn(req, res, c);
      if (out !== undefined && !res.headersSent) res.status(200).json(out);
    } catch (e) {
      const status = e.status || 500;
      if (!res.headersSent) res.status(status).json({ error: e.message || String(e) });
    }
  };
}

// ---------------------------------------------------------------- GitHub
async function gh(c, method, path, body, accept) {
  if (!c.token || !c.repo) throw new HttpError(500, "Faltan GITHUB_TOKEN o GITHUB_REPO en Vercel.");
  const r = await fetch(`https://api.github.com/repos/${c.repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: accept || "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "cancionero-de-papa",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r;
}

async function ghFail(c, r, what) {
  let detail = "";
  try { detail = (await r.json()).message || ""; } catch (e) {}
  if (r.status === 401) return new HttpError(502, `GitHub no acepta el token al ${what} (mal copiado o caducado). [${detail}]`);
  if (r.status === 403) return new HttpError(502, `El token no tiene permiso para ${what}: pon «Contents: Read and write» para «${c.repo}». [${detail}]`);
  if (r.status === 404) return new HttpError(502, `GitHub no encuentra «${c.repo}» al ${what}. GITHUB_REPO debe ser usuario/nombre. [${detail}]`);
  return new HttpError(502, `GitHub ha fallado al ${what} (error ${r.status}). [${detail}]`);
}

async function tree(c) {
  let r = await gh(c, "GET", `/git/trees/${BRANCH}?recursive=1`);
  if (r.status === 404 || r.status === 409) {
    // la rama «datos» aún no existe: se crea a partir de la principal
    const info = await gh(c, "GET", "");
    if (!info.ok) throw await ghFail(c, info, "leer el repositorio");
    const base = (await info.json()).default_branch || "main";
    const ref = await gh(c, "GET", `/git/ref/heads/${base}`);
    if (!ref.ok) throw await ghFail(c, ref, "leer la rama principal");
    const mk = await gh(c, "POST", "/git/refs", { ref: `refs/heads/${BRANCH}`, sha: (await ref.json()).object.sha });
    if (!mk.ok) throw await ghFail(c, mk, "crear la rama de datos");
    r = await gh(c, "GET", `/git/trees/${BRANCH}?recursive=1`);
  }
  if (!r.ok) throw await ghFail(c, r, "leer las canciones");
  return ((await r.json()).tree || []).filter((t) => t.type === "blob" && t.path.startsWith("songs/"));
}

async function blobJson(c, sha) {
  const r = await gh(c, "GET", `/git/blobs/${sha}`);
  if (!r.ok) return null;
  const j = await r.json();
  return JSON.parse(Buffer.from(j.content, "base64").toString("utf-8"));
}

async function shaOf(c, path) {
  const r = await gh(c, "GET", `/contents/${encodeURI(path)}?ref=${BRANCH}`);
  if (r.status === 404) return null;
  if (!r.ok) throw await ghFail(c, r, "leer");
  return (await r.json()).sha;
}

async function putFile(c, path, buf, msg) {
  const body = { message: msg, content: Buffer.from(buf).toString("base64"), branch: BRANCH };
  for (let attempt = 0; attempt < 3; attempt++) {
    const sha = await shaOf(c, path);
    if (sha) body.sha = sha; else delete body.sha;
    const r = await gh(c, "PUT", `/contents/${encodeURI(path)}`, body);
    if (r.ok) return;
    if (r.status !== 409 && r.status !== 422) throw await ghFail(c, r, "guardar");
    await new Promise((ok) => setTimeout(ok, 400 * (attempt + 1)));
  }
  throw new HttpError(502, "GitHub estaba ocupado y no se ha podido guardar. Prueba otra vez.");
}

async function deleteFile(c, path) {
  const sha = await shaOf(c, path);
  if (!sha) return;
  const r = await gh(c, "DELETE", `/contents/${encodeURI(path)}`, { message: `Borrar ${path}`, sha, branch: BRANCH });
  if (!r.ok && r.status !== 404) throw await ghFail(c, r, "borrar");
}

async function rawFile(c, path) {
  const r = await gh(c, "GET", `/contents/${encodeURI(path)}?ref=${BRANCH}`, null, "application/vnd.github.raw");
  if (!r.ok) return null;
  return Buffer.from(await r.arrayBuffer());
}

function slug(text) {
  const t = String(text || "cancion").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return t || "cancion";
}
const rid = () => Math.random().toString(16).slice(2, 7);
const safeId = (id) => /^[\w-]+$/.test(id || "");

// ---------------------------------------------------------------- canción: formato limpio
const int = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const r4 = (v) => Math.round(v * 10000) / 10000;

function beatsPerBar(ts) {
  const n = parseInt(String(ts || "4/4").split("/")[0], 10);
  return n > 0 && n <= 12 ? n : 4;
}

function normalize(x) {
  x = x || {};
  let ts = String(x.ts || "").trim();
  if (!TIME_SIGNATURES.includes(ts)) ts = "4/4";
  let tempo = Math.round(num(x.tempo) || 80);
  tempo = Math.max(30, Math.min(240, tempo));
  const song = {
    title: String(x.title || "Sin título").trim(),
    ts, tempo,
    page: String(x.page || "").trim(),
    general: (x.general || []).map((g) => String(g).trim()).filter(Boolean),
    sections: [],
  };
  const m = beatsPerBar(ts);
  for (const sec of x.sections || []) {
    const ns = { label: String((sec || {}).label || "").trim(), lines: [] };
    for (const line of (sec || {}).lines || []) {
      const nl = { cues: ((line || {}).cues || []).map((c) => String(c).trim()).filter(Boolean), units: [] };
      const bx = (line || {}).box;
      if (Array.isArray(bx) && bx.length === 3) {
        const p = int(bx[0]) || 1, t = num(bx[1]), b = num(bx[2]);
        if (t !== null && b !== null && t >= 0 && b <= 1 && b > t) nl.box = [p, r4(t), r4(b)];
      }
      for (const u of (line || {}).units || []) {
        if (!u || typeof u !== "object") continue;
        let notes = u.n || [];
        if (typeof notes === "string") notes = notes.split(/\s*[-–]\s*/);
        const nu = { t: String(u.t || "").replace(/\s+$/, ""), n: notes.map((v) => String(v).trim()).filter(Boolean) };
        const b = int(u.b);
        if (b && b >= 1 && b <= m) {
          nu.b = b;
          const uu = int(u.u);
          if (uu && uu >= 1 && uu <= m) nu.u = uu;
        }
        for (const k of ["mark", "acc", "pause"]) if (u[k]) nu[k] = true;
        if (u.x) nu.x = String(u.x).slice(0, 4);
        if (Array.isArray(u.nd) && u.nd.length === nu.n.length && nu.n.length > 1) {
          const nds = u.nd.map(num);
          if (nds.every((v) => v && v > 0)) nu.nd = nds.map(r4);
        }
        if (Array.isArray(u.rec)) {
          const rec = [...new Set(u.rec.map(int).filter((i) => i !== null && i >= 0 && i < nu.n.length))].sort((a, b) => a - b);
          if (rec.length) nu.rec = rec;
        }
        for (const k of ["pos", "e", "d", "r"]) { const v = num(u[k]); if (v !== null) nu[k] = r4(v); }
        if (nu.t || nu.n.length) nl.units.push(nu);
      }
      if (nl.units.length || nl.cues.length) ns.lines.push(nl);
    }
    if (ns.lines.length) song.sections.push(ns);
  }
  return song;
}

function parseJson(text) {
  let t = String(text || "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch (e) {
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw e;
  }
}

// ---------------------------------------------------------------- OpenAI
async function openaiChat(c, content, maxTokens) {
  if (!c.openai) throw new HttpError(500, "Falta OPENAI_API_KEY en Vercel.");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${c.openai}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: c.model,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
      max_completion_tokens: maxTokens,
    }),
  });
  let j = {};
  try { j = await r.json(); } catch (e) {}
  if (!r.ok) {
    const d = (j.error && j.error.message) || "";
    if (r.status === 401) throw new HttpError(502, "La clave de OpenAI no es válida. Revísala en Vercel.");
    if (r.status === 429) throw new HttpError(502, "OpenAI dice que no hay saldo o que has llegado al límite. Revisa platform.openai.com.");
    if (r.status === 404) throw new HttpError(502, `El modelo «${c.model}» no está disponible para esta clave. Cambia OPENAI_MODEL.`);
    throw new HttpError(502, `OpenAI ha devuelto un error (${r.status}). ${d}`);
  }
  const ch = (j.choices || [])[0] || {};
  return { text: (ch.message && ch.message.content) || "", refusal: ch.message && ch.message.refusal, cut: ch.finish_reason === "length" };
}

module.exports = {
  BRANCH, HttpError, handler, tree, blobJson, putFile, deleteFile, rawFile, slug, rid, safeId,
  normalize, parseJson, openaiChat, num, int,
};
