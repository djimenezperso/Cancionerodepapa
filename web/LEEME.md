# Cancionero de Papá — versión web (Vercel)

Esta carpeta es la app entera. Usa las mismas canciones que la de Streamlit: las dos leen y guardan en la rama `datos` del mismo repositorio de GitHub.

## Qué hay dentro

- `public/`: la página (repertorio, nueva canción, partitura y dictado).
- `api/`: las funciones del servidor. Hablan con GitHub y con OpenAI, y las claves quedan escondidas en Vercel.
- `vercel.json`: deja hasta 5 minutos a la IA para leer una hoja.

## Ponerla en marcha

1. En GitHub, en el repositorio `Cancionerodepapa`, crea una carpeta `web` y sube dentro todo el contenido de esta carpeta: `api`, `public`, `vercel.json`, `package.json`. Puedes arrastrar las carpetas a «Add file → Upload files».
2. Entra en vercel.com con tu cuenta de GitHub → **Add New… → Project** → importa `Cancionerodepapa`.
3. En **Root Directory** elige `web`. En **Framework Preset**, deja «Other».
4. En **Environment Variables** añade:

   | Nombre | Valor |
   |---|---|
   | `APP_PASSWORD` | la contraseña para entrar (la que quieras) |
   | `OPENAI_API_KEY` | tu clave de OpenAI |
   | `GITHUB_TOKEN` | el mismo token que pusiste en Streamlit |
   | `GITHUB_REPO` | `djimenezperso/Cancionerodepapa` |
   | `OPENAI_MODEL` | opcional; por defecto `gpt-5` |

5. Pulsa **Deploy**. Al terminar te da una dirección (`…vercel.app`). Ábrela en el móvil, pon la contraseña y, en el menú del navegador, «Añadir a pantalla de inicio».

Si Vercel se queja de `maxDuration`, cambia el 300 de `vercel.json` por 60.
