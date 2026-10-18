// POST: guardar una canción · DELETE ?id=…: borrarla (con sus fotos).
const L = require("./_lib/core");
module.exports = L.handler(async (req, res, c) => {
  if (req.method === "POST") {
    const row = (req.body || {}).row || {};
    let id = (req.body || {}).id;
    if (id && !L.safeId(id)) throw new L.HttpError(400, "Nombre de canción no válido.");
    if (!id) id = `${L.slug(row.title)}-${L.rid()}`;
    const data = {
      title: String(row.title || (row.song && row.song.title) || "Sin título").slice(0, 200),
      page: String(row.page || "").slice(0, 20),
      photos: (row.photos || []).filter((p) => /^songs\/photos\/[\w.-]+$/.test(p)),
      song: row.song ? L.normalize(row.song) : null,
      updatedAt: new Date().toISOString().slice(0, 19),
    };
    await L.putFile(c, `songs/${id}.json`, Buffer.from(JSON.stringify(data, null, 1), "utf-8"), `Guardar «${data.title}»`);
    return { id, row: { ...data, id } };
  }
  if (req.method === "DELETE") {
    const id = req.query.id;
    if (!L.safeId(id)) throw new L.HttpError(400, "Nombre de canción no válido.");
    const photos = ((req.query.photos || "").split(",")).filter((p) => /^songs\/photos\/[\w.-]+$/.test(p));
    for (const p of photos) await L.deleteFile(c, p);
    await L.deleteFile(c, `songs/${id}.json`);
    return { ok: true };
  }
  throw new L.HttpError(405, "Método no permitido.");
});
