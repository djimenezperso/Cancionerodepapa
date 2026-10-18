// GET: todas las canciones guardadas (en la rama «datos» de GitHub).
const L = require("./_lib/core");
module.exports = L.handler(async (req, res, c) => {
  const files = (await L.tree(c)).filter((t) => /^songs\/[^/]+\.json$/.test(t.path));
  const rows = await Promise.all(files.map(async (t) => {
    try {
      const d = await L.blobJson(c, t.sha);
      if (!d) return null;
      d.id = t.path.slice(6, -5);
      return d;
    } catch (e) { return null; }
  }));
  res.setHeader("Cache-Control", "no-store");
  return { songs: rows.filter(Boolean).sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "es")) };
});
