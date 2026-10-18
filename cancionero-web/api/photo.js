// GET ?path=songs/photos/…: devuelve la foto · POST {image(base64), base}: la guarda.
const L = require("./_lib/core");
module.exports = L.handler(async (req, res, c) => {
  if (req.method === "POST") {
    const { image, base, i } = req.body || {};
    if (!image) throw new L.HttpError(400, "Falta la foto.");
    const name = `${L.slug(base || "hoja")}-${L.rid()}_${parseInt(i, 10) || 1}.jpg`;
    const path = `songs/photos/${name}`;
    await L.putFile(c, path, Buffer.from(String(image).replace(/^data:[^,]+,/, ""), "base64"), `Foto ${name}`);
    return { path };
  }
  const p = String(req.query.path || "");
  if (!/^songs\/photos\/[\w.-]+$/.test(p)) throw new L.HttpError(400, "Foto no válida.");
  const buf = await L.rawFile(c, p);
  if (!buf) throw new L.HttpError(404, "No se encuentra la foto.");
  res.setHeader("Content-Type", p.endsWith(".png") ? "image/png" : "image/jpeg");
  res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
  res.status(200).send(buf);
});
