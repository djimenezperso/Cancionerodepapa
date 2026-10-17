# Cancionero de Papá

Pasa a limpio las hojas de canto de Papá a partir de una foto: notas en solfeo con su octava, el tiempo del compás donde cae cada nota (los números azules y verdes), los aguantes («4-1»), el amarillo, las flechas y los apuntes de técnica («no perder metal», «sonreír»…). Luego se escuchan con melodía y metrónomo, se corrigen en una tabla y se descargan en un único archivo para leer en el móvil sin internet.

## Qué hay dentro

- `app.py`: la app de Streamlit (pestañas: Canciones guardadas · Nueva canción · Llevar en el móvil).
- `lib.py`: guardado, lectura de fotos con IA (OpenAI o Claude) y visor.
- `assets/`: el visor de canciones (dibujo, metrónomo y melodía).
- `songs/`: las canciones guardadas. Vienen las tres hojas de ejemplo (solo la foto, sin pasar a limpio) y «Cumpleaños feliz» ya pasada a limpio.

## Probarla en tu ordenador

```bash
pip install -r requirements.txt
cp .streamlit/secrets.toml.example .streamlit/secrets.toml   # y pon tu clave de OpenAI
streamlit run app.py
```

Se abre en http://localhost:8501. Para verla en el móvil en la misma wifi, abre la dirección «Network URL» que aparece en la terminal.

## Publicarla gratis (Streamlit Community Cloud)

1. Crea un repositorio **privado** en GitHub y sube esta carpeta tal cual.
2. Entra en https://share.streamlit.io con tu cuenta de GitHub → **Create app** → elige el repositorio, rama `main` y archivo `app.py`.
3. En **Advanced settings → Secrets** (o después en **⋮ → Settings → Secrets**) pega:

```toml
OPENAI_API_KEY = "sk-..."
GITHUB_TOKEN = "github_pat_..."
GITHUB_REPO = "tu-usuario/cancionerodepapa"
```

4. Pulsa **Deploy**.

### Para que las canciones no se borren

Las canciones nuevas se guardan solas en la rama `datos` de tu repositorio (la app la crea sola la primera vez). Para eso necesita un token de GitHub:

1. GitHub → tu foto (arriba a la derecha) → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Nombre: `cancionero`. Caducidad: la más larga que te deje (o «No expiration»).
3. **Repository access** → **Only select repositories** → elige `cancionerodepapa`.
4. **Permissions** → **Repository permissions** → **Contents** → **Read and write**.
5. **Generate token**, cópialo y ponlo en Secrets como `GITHUB_TOKEN`.

En la pestaña «Llevar en el móvil → Copia de seguridad» la app dice si el guardado en GitHub funciona.

### Opcional

- `OPENAI_MODEL = "gpt-5-mini"` para usar un modelo más barato (por defecto `gpt-5`).
- Con Claude en lugar de OpenAI: `ANTHROPIC_API_KEY = "sk-ant-..."`.

## A tener en cuenta

- Sin `GITHUB_TOKEN`, las canciones nuevas se pierden cuando la app se reinicia.
- Con canciones muy conocidas, la IA puede negarse a transcribir la letra entera. En ese caso, escribe la letra en «Nueva canción → Escribir la letra» y pon las notas en la tabla de «Corregir».
- La cámara integrada de Streamlit es pequeña; en el móvil suele ir mejor «Galería», que deja usar la cámara normal del teléfono.
