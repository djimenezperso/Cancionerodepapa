// POST {images:[base64 jpeg], title}: la IA lee la hoja y devuelve {song, doubts}.
const L = require("./_lib/core");
const P = require("./_lib/prompts");
const REFUSED = "La IA no ha transcrito esta hoja (a veces pasa con letras de canciones conocidas). Puedes escribir la letra en «Nueva canción» y poner las notas dictando.";
module.exports = L.handler(async (req, res, c) => {
  const { images, title } = req.body || {};
  if (!Array.isArray(images) || !images.length) throw new L.HttpError(400, "Faltan las fotos.");
  const prompt = P.PROMPT + (title ? `\n\nEl título de la canción es: ${title}` : "");
  const content = [{ type: "text", text: prompt }].concat(images.slice(0, 4).map((b64) => ({
    type: "image_url",
    image_url: { url: String(b64).startsWith("data:") ? b64 : "data:image/jpeg;base64," + b64, detail: "high" },
  })));
  const out = await L.openaiChat(c, content, 16000);
  if (out.refusal || !out.text.trim()) throw new L.HttpError(422, REFUSED);
  let data;
  try { data = L.parseJson(out.text); } catch (e) {
    throw new L.HttpError(502, "No se ha podido entender la respuesta." + (out.cut ? " Salió cortada; prueba con menos fotos a la vez." : ""));
  }
  const doubts = (data.doubts || []).map(String).filter((d) => d.trim());
  const song = L.normalize(data);
  if (title && (!song.title || song.title === "Sin título")) song.title = title;
  return { song, doubts };
});
