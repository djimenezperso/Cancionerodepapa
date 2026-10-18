// GET: comprueba la contraseña y que esté todo configurado.
const L = require("./_lib/core");
module.exports = L.handler(async (req, res, c) => ({
  ok: true,
  github: !!(c.token && c.repo),
  openai: !!c.openai,
}));
