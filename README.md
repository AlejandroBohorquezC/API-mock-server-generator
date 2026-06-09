# API Mock Server Generator

Pega JSON → obtén una API REST funcional al instante.

## Requisitos

- Node.js >= 18
- npm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Esto levanta el backend en `http://localhost:3000` y el frontend en `http://localhost:3001`.

## Uso

1. Abre `http://localhost:3001` en el navegador.
2. Pega un JSON con tus recursos en el editor. Ejemplo:

```json
{
  "users": [{"id": 1, "name": "Alice"}],
  "products": [],
  "orders": []
}
```

3. Haz clic en **Generar API**.
4. La UI mostrará los endpoints CRUD generados para cada recurso, listos para copiar.

## Endpoints generados (ejemplo: recurso `users`)

| Método | Ruta |
|--------|------|
| GET | `/mock/{sessionId}/users` |
| POST | `/mock/{sessionId}/users` |
| GET | `/mock/{sessionId}/users/:id` |
| PUT | `/mock/{sessionId}/users/:id` |
| DELETE | `/mock/{sessionId}/users/:id` |

## Persistencia

Los datos se almacenan **en memoria** en el servidor. Se pierden al reiniciar el backend. Cada sesión (`sessionId`) tiene su propio conjunto de datos aislado.

## Estructura

```
api-mock-generator/
├── frontend/    # Next.js 14 (App Router)
├── backend/     # NestJS
├── shared/      # Tipos TypeScript compartidos
└── README.md
```

## Deployment

### Frontend (Vercel)
- Root directory: `frontend`
- Framework: Next.js (auto-detected)
- Environment variables:
  - `NEXT_PUBLIC_API_URL`: URL of the deployed backend
  - `NEXT_PUBLIC_POSTHOG_KEY`: PostHog project API key (optional)
  - `NEXT_PUBLIC_POSTHOG_HOST`: PostHog host (default: https://app.posthog.com)

### Backend (Render)
- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm run start:prod`
- Environment variables:
  - `PORT`: 3000
  - `FRONTEND_URL`: URL of the deployed frontend (for CORS)
