// POST {song}: la IA propone la duración de cada sílaba.
const L = require("./_lib/core");
const P = require("./_lib/prompts");
module.exports = L.handler(async (req, res, c) => {
  const song = (req.body || {}).song;
  const flat = [];
  for (const s of (song && song.sections) || []) for (const l of s.lines || []) for (const u of l.units || []) flat.push(u);
  if (!flat.length) throw new L.HttpError(400, "La canción no tiene sílabas.");
  const lines = flat.map((u, i) => `${i + 1}. «${u.t || ""}» notas: ${(u.n || []).join("-") || "—"}${u.b ? ` tiempo ${u.b}` : ""}${u.u ? ` hasta ${u.u}` : ""}`);
  const vals = [String(flat.length), song.ts || "4/4", song.title || "", lines.join("\n")];
  let k = 0;
  const prompt = P.RHYTHM.replace(/%[ds]/g, () => vals[k++]);
  const out = await L.openaiChat(c, prompt, 8000);
  let units;
  try { const d = L.parseJson(out.text); units = Array.isArray(d) ? d : d.units; } catch (e) {
    throw new L.HttpError(502, "No se ha podido entender la respuesta. Prueba otra vez.");
  }
  if (!Array.isArray(units) || units.length !== flat.length) throw new L.HttpError(502, `La IA devolvió ${units ? units.length : 0} duraciones para ${flat.length} sílabas. Prueba otra vez.`);
  const neu = JSON.parse(JSON.stringify(song));
  let i = 0;
  for (const s of neu.sections || []) for (const l of s.lines || []) for (const u of l.units || []) {
    const d = L.num(units[i].d), r = L.num(units[i].r);
    delete u.pos; delete u.e;
    if (d && d > 0) u.d = d;
    if (r && r > 0) u.r = r; else delete u.r;
    i++;
  }
  return { song: L.normalize(neu) };
});
