# Orienta — Asistente Vocacional

Orientación vocacional para estudiantes de Guatemala. El alumno conversa con un
guía, responde un cuestionario que se adapta a lo que va contestando y recibe un
tablero con las carreras más afines a su perfil, tomadas de un catálogo real de
universidades por departamento.

El sistema ofrece dos caminos, que se pueden encadenar:

- **El chat.** Cuatro preguntas fijas y luego entre cuatro y ocho preguntas
  generadas sobre la marcha, según lo que falte por conocer del alumno.
- **El test de intereses de Holland (RIASEC).** Los 60 ítems del *O*NET Interest
  Profiler*, servidos y calificados por el servicio oficial de O*NET.

Quien hace el test primero llega al chat con su perfil de intereses ya medido, y
la conversación arranca desde ahí.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React (Vite), gráficas con Recharts, PDF con jsPDF |
| Backend | FastAPI (Python 3.12, gestionado con uv), SQLAlchemy + psycopg |
| Base de datos | PostgreSQL |
| Motor de IA | API de Gemini (SDK `google-genai`), con salida estructurada JSON validada con Pydantic |
| Instrumento de intereses | API oficial de O*NET Web Services |

---

## Cómo funciona

```
Alumno
  ↓  elige departamento o región en el mapa           Mapa.jsx
React
  ↓  nombre + 4 preguntas vocacionales fijas, con voz neuronal (/api/tts)
  ↓  4-8 preguntas adaptativas    →   POST /api/next-question
FastAPI
  ↓  filtro.py recorta el catálogo a 35 carreras, sin IA
Gemini
  ↓  JSON estructurado, validado con Pydantic
PostgreSQL   respuestas · resultados · consumo de tokens
  ↓  POST /api/recommend
Dashboard    barras + dona + detalle por institución + PDF
  ↓  extras a pedido, 1 llamada cada uno:  /api/simular-dia  ·  /api/comparar
```

El **catálogo de carreras es la fuente de verdad**: los prompts no mencionan
carreras concretas, así que agregar universidades o sedes no requiere tocar
código, solo cargar datos (`backend/data/`, `backend/seed_carreras.py`).

El pre-filtro que recorta el catálogo antes de llamar a la IA no usa IA: es
selección por texto y departamento (`backend/app/filtro.py`), y existe para que
el prompt quepa y cueste menos.

---

## Acceso y límites de uso

Iniciar sesión con Google es **obligatorio** para evaluarse. Encima del login hay
dos límites (`backend/app/cuota.py`):

- **Enfriamiento** entre evaluaciones terminadas, por instrumento
  (`HORAS_ENFRIAMIENTO`, 4 por defecto).
- **Tope global diario** de tokens de Gemini (`TOPE_TOKENS_DIARIO`), como freno
  de emergencia del crédito.

Los dos responden **429** con un mensaje que dice cuándo se puede volver. El
**503** queda reservado para "el servidor no está configurado".

---

## Cómo correrlo

Requisitos: Docker Desktop, Python 3.12 con [uv](https://docs.astral.sh/uv/) y
Node 20+.

1. Copiar `backend/.env.example` a `backend/.env` y llenar `GEMINI_API_KEY`,
   `ONET_API_KEY`, `GOOGLE_CLIENT_ID` y `SESSION_SECRET`. Cada variable trae en
   el archivo de ejemplo de dónde se saca.
2. Copiar `frontend/.env.example` a `frontend/.env` con el mismo client id de
   Google.

En Windows, desde la raíz:

```powershell
.\start.ps1
```

Levanta la base de datos en Docker, carga el catálogo, arranca el backend y el
frontend y abre el navegador. `.\stop.ps1` detiene todo.

Manual:

```bash
docker run --name orienta-db -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=tfg -p 5432:5432 -d postgres:16
cd backend && uv run python seed_carreras.py && uv run uvicorn app.main:app --reload
cd frontend && npm install && npm run dev
```

La documentación interactiva de la API queda en http://localhost:8000/docs.

### Autocomprobaciones sin red

Varios módulos traen su propia verificación, que no llama a ninguna API:

```bash
cd backend && uv run python -m app.cuota && uv run python -m app.auth && uv run python -m app.personalidad
```

---

## Estructura

```
backend/
  app/
    main.py           endpoints FastAPI
    auth.py           login con Google, JWT propio
    cuota.py          enfriamiento entre evaluaciones y tope global
    preguntas.py      prompt del cuestionario adaptativo
    recomendar.py     prompt de la recomendación final
    filtro.py         pre-filtro del catálogo, sin IA
    holland.py        proxy del O*NET Interest Profiler
    psicometrico.py   examen de 100 ítems
    personalidad.py   perfil corto de 48 ítems
    models.py         tablas
  data/               catálogo de carreras por universidad
  seed_carreras.py    carga el catálogo en la base
frontend/
  src/                páginas React (chat, dashboard, mapa, catálogo, tests)
```

---

## Créditos y licencias de terceros

El test de intereses usa **O*NET Web Services**, del Departamento de Trabajo de
los Estados Unidos. Los ítems y el puntaje los sirve ese servicio; esta
plataforma no los modifica y los acredita en pantalla, como exige su licencia de
uso. https://services.onetcenter.org/

La síntesis de voz usa el servicio de lectura en voz alta de Microsoft Edge a
través de `edge-tts`, con caída automática a la voz nativa del navegador.
