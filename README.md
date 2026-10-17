# Cancionero de Papá

Pasa a limpio las hojas de canto de Papá a partir de una foto: notas en solfeo con su octava, el tiempo del compás donde cae cada nota (los números azules y verdes), los aguantes («4-1»), el amarillo, las flechas y los apuntes de técnica («no perder metal», «sonreír»…). Luego se escuchan con melodía y metrónomo, se corrigen en una tabla y se descargan en un único archivo para leer en el móvil sin internet.

## Qué hay dentro

- `app.py`: la app de Streamlit (pestañas: Canciones guardadas · Nueva canción · Llevar en el móvil).
- `lib.py`: guardado, lectura de fotos con Claude y visor.
- `assets/`: el visor de canciones (dibujo, metrónomo y melodía).
- `songs/`: las canciones guardadas. Vienen las tres hojas de ejemplo (solo la foto, sin pasar a limpio) y «Cumpleaños feliz» ya pasada a limpio.

## Probarla en tu ordenador

```bash
pip install -r requirements.txt
cp .streamlit/secrets.toml.example .streamlit/secrets.toml   # y pon tu clave
streamlit run app.py
```

Se abre en http://localhost:8501. Para verla en el móvil en la misma wifi, abre la dirección «Network URL» que aparece en la terminal.

## Publicarla gratis (Streamlit Community Cloud)

1. Crea un repositorio **privado** en GitHub (las fotos de las hojas van dentro) y sube esta carpeta tal cual.
2. Entra en https://share.streamlit.io con tu cuenta de GitHub → **Create app** → elige el repositorio, rama `main` y archivo `app.py`.
3. En **Advanced settings → Secrets** pega:
   `ANTHROPIC_API_KEY = "sk-ant-..."`
4. Pulsa **Deploy**. Te dará un enlace que puedes abrir en el móvil (y guardarlo en la pantalla de inicio).

La clave se crea en https://console.anthropic.com (API Keys). Leer una hoja cuesta unos céntimos.

## A tener en cuenta

- En Streamlit Cloud las canciones que se guardan nuevas se pierden cuando la app se reinicia (pasa tras días sin uso o al actualizar el código). Usa «Llevar en el móvil → Descargar copia» de vez en cuando y «Recuperar una copia» si hace falta. Las que estén subidas en `songs/` del repositorio no se pierden nunca.
- Con canciones muy conocidas, Claude puede negarse a transcribir la letra entera. En ese caso, escribe la letra en «Nueva canción → Escribir la letra» y pon las notas en la tabla de «Corregir».
- La cámara integrada de Streamlit es pequeña; en el móvil suele ir mejor «Galería», que deja usar la cámara normal del teléfono.
