// POST {images:[base64], lines:[texto de cada verso]}: dónde está cada verso en la foto (para recortarlo).
const L = require("./_lib/core");
const PROMPT = `Las imágenes son fotos (en orden: foto 1, foto 2…) de una hoja de canto escrita a mano. Cada renglón tiene la letra y, encima, las notas y números de tiempo en colores.

Abajo tienes los versos (renglones) de la hoja, numerados y en orden. Para cada verso, di en qué foto está y la franja vertical que ocupa, incluyendo las notas y números escritos ENCIMA de la letra (pero no el verso anterior):
- "p": número de foto (1, 2…)
- "top": borde de arriba de la franja, como fracción de la altura de esa foto (0 = arriba del todo, 1 = abajo del todo)
- "bottom": borde de abajo, igual

Las franjas van de arriba abajo en orden y no se solapan apenas. Responde solo con JSON:
{"boxes":[{"i":1,"p":1,"top":0.12,"bottom":0.19}, ...]} con exactamente %N% elementos.

Versos:
%L%`;
module.exports = L.handler(async (req, res, c) => {
  const { images, lines } = req.body || {};
  if (!Array.isArray(images) || !images.length) throw new L.HttpError(400, "Faltan las fotos.");
  if (!Array.isArray(lines) || !lines.length) throw new L.HttpError(400, "La canción no tiene versos.");
  const prompt = PROMPT.replace("%N%", String(lines.length)).replace("%L%", lines.map((t, i) => `${i + 1}. ${t}`).join("\n"));
  const content = [{ type: "text", text: prompt }].concat(images.slice(0, 4).map((b64) => ({
    type: "image_url", image_url: { url: "data:image/jpeg;base64," + String(b64).replace(/^data:[^,]+,/, ""), detail: "high" },
  })));
  const out = await L.openaiChat(c, content, 6000);
  let data;
  try { data = L.parseJson(out.text); } catch (e) { throw new L.HttpError(502, "No se ha podido entender la respuesta. Prueba otra vez."); }
  const list = Array.isArray(data) ? data : data.boxes || [];
  const boxes = lines.map((_, i) => {
    const b = list.find((x) => L.int(x.i) === i + 1) || list[i];
    if (!b) return null;
    const p = Math.max(1, Math.min(images.length, L.int(b.p) || 1));
    let t = L.num(b.top), bo = L.num(b.bottom);
    if (t === null || bo === null) return null;
    if (t > 1 || bo > 1) { t /= 100; bo /= 100; } // por si lo da en porcentaje
    t = Math.max(0, Math.min(1, t)); bo = Math.max(0, Math.min(1, bo));
    if (bo - t < 0.01) return null;
    return [p, Math.round(t * 1000) / 1000, Math.round(bo * 1000) / 1000];
  });
  return { boxes };
});
