# Listado de Endpoints API disponibles

## Endpoints de RundeckApi (API de integración con Rundeck)

| Método | Ruta | Descripción | Parámetros/Body |
|--------|------|-------------|-----------------|
| **POST** | `/api/rundeck/jobs/execute` | Ejecuta un job en Rundeck | Body: `{ "jobId": "string", "options": { key: value } }` |
| **GET** | `/api/rundeck/executions/:executionId` | Obtiene el estado de una ejecución | Param: `executionId` |
| **GET** | `/api/rundeck/projects/:projectName/jobs` | Lista los jobs disponibles en un proyecto | Param: `projectName` |
| **GET** | `/api/rundeck/saved-executions` | Lista las ejecuciones guardadas en MongoDB | Query: `jobId`, `status` (opcionales) |
| **POST** | `/api/rundeck/executions/:executionId/update` | Actualiza manualmente el estado de una ejecución | Param: `executionId` |
| **POST** | `/api/rundeck/executions/update-all` | Actualiza todas las ejecuciones en curso | - |

## Endpoints de Webhook de Rundeck

| Método | Ruta | Descripción | Headers/Body |
|--------|------|-------------|-------------|
| **POST** | `/api/rundeck/webhook` | Recibe notificaciones de Rundeck | Header: `X-Rundeck-Webhook-Token` (opcional)<br>Body: Formato JSON de Rundeck |

## Endpoints de Rundeck (Listado de instancias)

> Nota: Estos endpoints parecen ser para gestionar la lista de instancias de Rundeck, no para interactuar con la API de Rundeck directamente.

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| **GET** | `/api/rundeck` | Obtiene la lista de instancias de Rundeck | - |
| **GET** | `/api/rundeck/:id` | Obtiene detalles de una instancia específica | Param: `id` |
| **POST** | `/api/rundeck` | Crea una nueva instancia de Rundeck | Body: datos de la instancia |
| **PUT** | `/api/rundeck/:id` | Actualiza una instancia existente | Param: `id`, Body: datos actualizados |
| **DELETE** | `/api/rundeck/:id` | Elimina una instancia | Param: `id` |

## Endpoints de Dynatrace

> Nota: Estos endpoints parecen ser para la integración con Dynatrace, aunque no se muestran detalles en el código proporcionado.

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| **GET** | `/api/dynatrace` | Probablemente obtiene datos de Dynatrace | - |
| **...** | *Más endpoints* | *No se pueden determinar sin ver el código de `Dynatrace_Route.js`* | - |

## Endpoint principal

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| **GET** | `/` | Verifica que la API está funcionando | - |

## Ejemplos de uso

### 1. Ejecutar un job de Rundeck

```bash
curl -X POST http://localhost:5001/api/rundeck/jobs/execute \
  -H "Content-Type: application/json" \
  -d '{"jobId": "b42e8919-ffad-4e4a-8734-b6bfb4d92bff", "options": {"env": "production"}}'
```

### 2. Obtener estado de una ejecución

```bash
curl http://localhost:5001/api/rundeck/executions/12345
```

### 3. Listar jobs de un proyecto

```bash
curl http://localhost:5001/api/rundeck/projects/MyProject/jobs
```

### 4. Buscar ejecuciones guardadas por estado

```bash
curl http://localhost:5001/api/rundeck/saved-executions?status=succeeded
```

### 5. Actualizar todas las ejecuciones en curso

```bash
curl -X POST http://localhost:5001/api/rundeck/executions/update-all
```

### 6. Obtener listado de instancias de Rundeck

```bash
curl http://localhost:5001/api/rundeck
```

## Notas importantes

1. Todos los endpoints están prefijados con `/api` excepto la ruta principal `/`.

2. Para las llamadas que requieren autenticación con Rundeck, asegúrate de que las variables de entorno estén correctamente configuradas.

3. Los webhooks deben ser configurados en Rundeck para apuntar a tu endpoint `/api/rundeck/webhook`.

4. Algunas rutas pueden requerir parámetros adicionales que no se ven en el código proporcionado.

5. Es recomendable usar Postman u otra herramienta similar para probar estos endpoints más fácilmente.