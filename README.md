# 📅 Auto Notion Scheduler

Automatización de planificación semanal en Notion con arquitectura limpia, modular y extensible.

## 🎯 Descripción

Este proyecto automatiza la generación de tu plan semanal base en Notion Calendar. Cada domingo, el sistema lee una base de datos de plantillas con tu rutina estándar y crea automáticamente los eventos para la próxima semana en tu calendario de Notion.

### Características principales

- ✅ Generación automática de eventos semanales desde plantillas
- ✅ Integración completa con Notion API
- ✅ Cálculo inteligente de fechas y horarios
- ✅ Logging estructurado con Winston
- ✅ Manejo robusto de errores con reintentos automáticos
- ✅ Automatización con GitHub Actions (ejecución cada domingo)
- ✅ Arquitectura modular y extensible
- ✅ Lista para escalar (Google Calendar, IA, tracking de hábitos)

## 🏗️ Arquitectura del Proyecto

```
auto-notion-scheduler/
├── .github/
│   └── workflows/
│       └── schedule.yml        # Workflow de GitHub Actions
├── src/
│   ├── config/
│   │   ├── environment.js      # Configuración de variables de entorno
│   │   └── notion.js           # Cliente de Notion inicializado
│   ├── services/
│   │   └── notionService.js    # Servicio de interacción con Notion API
│   ├── utils/
│   │   ├── logger.js           # Sistema de logging con Winston
│   │   ├── dateHelper.js       # Utilidades para manejo de fechas
│   │   └── errorHandler.js     # Manejo centralizado de errores
│   ├── jobs/
│   │   └── generateWeek.js     # Job principal de generación semanal
│   └── index.js                # Punto de entrada de la aplicación
├── logs/                        # Directorio de logs (auto-generado)
├── .gitignore
├── env.example                  # Plantilla de variables de entorno
├── package.json
└── README.md
```

## 🚀 Configuración Inicial

### Prerrequisitos

- Node.js >= 20.0.0
- Cuenta de Notion con permisos de administrador
- Integración de Notion creada

### 1. Instalación

```bash
# Clonar el repositorio
git clone <tu-repo>
cd auto-notion-scheduler

# Instalar dependencias
npm install

# Crear directorio de logs
mkdir logs
```

### 2. Configurar Notion

#### A. Crear una integración en Notion

1. Ve a [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Haz clic en "+ New integration"
3. Dale un nombre: "Auto Scheduler"
4. Selecciona el workspace donde trabajarás
5. Configura los permisos:
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
6. Guarda y copia el **Internal Integration Token** (empieza con `secret_`)

#### B. Crear la Base de Datos de Plantillas (Template DB)

1. En Notion, crea una nueva página
2. Agrega una **Database - Table**
3. Nómbrala "Weekly Template"
4. Configura las siguientes propiedades:

| Propiedad | Tipo     | Descripción                           |
|-----------|----------|---------------------------------------|
| Name      | Title    | Nombre de la tarea/evento             |
| Day       | Select   | Día de la semana (Monday, Tuesday...) |
| Time      | Text     | Hora de inicio (formato HH:mm)        |
| Duration  | Number   | Duración en minutos                   |
| Notes     | Text     | Notas adicionales (opcional)          |

5. Agrega tus tareas de plantilla, por ejemplo:

| Name            | Day       | Time  | Duration | Notes                    |
|-----------------|-----------|-------|----------|--------------------------|
| Morning Routine | Monday    | 05:00 | 120      | Ejercicio incluido       |
| Work            | Monday    | 08:00 | 540      | Trabajo regular          |
| Evening Tasks   | Monday    | 18:00 | 120      | Tareas vespertinas       |
| Morning Routine | Tuesday   | 05:00 | 120      | Ejercicio incluido       |
| ...             | ...       | ...   | ...      | ...                      |

6. **Compartir con tu integración:**
   - Haz clic en "Share" (arriba a la derecha)
   - Busca tu integración "Auto Scheduler"
   - Haz clic en "Invite"

7. **Copiar el ID de la base de datos:**
   - La URL será algo como: `https://notion.so/xxxxx?v=yyyyy`
   - El ID es `xxxxx` (32 caracteres hexadecimales)

#### C. Crear la Base de Datos de Calendario (Calendar DB)

1. En Notion, crea otra nueva página
2. Agrega una **Database - Calendar**
3. Nómbrala "My Calendar"
4. Configura las siguientes propiedades:

| Propiedad | Tipo  | Descripción                    |
|-----------|-------|--------------------------------|
| Name      | Title | Nombre del evento              |
| Date      | Date  | Fecha y hora (con rango)       |
| Notes     | Text  | Notas del evento               |

5. **Compartir con tu integración** (igual que antes)
6. **Copiar el ID de la base de datos**

### 3. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar .env con tus valores
```

Edita el archivo `.env`:

```env
# Tu token de integración de Notion
NOTION_API_KEY=secret_tu_token_aqui

# ID de tu base de datos de plantillas
TEMPLATE_DB_ID=1234567890abcdef1234567890abcdef

# ID de tu base de datos de calendario
CALENDAR_DB_ID=abcdef1234567890abcdef1234567890

# Nivel de logging (debug, info, warn, error)
LOG_LEVEL=info

# Tu zona horaria
TIMEZONE=America/Mexico_City
```

## 🎮 Uso

### Ejecución Local

#### Generar semana manualmente

```bash
npm start
```

O directamente el job:

```bash
npm run generate-week
```

#### Modo desarrollo (con hot reload)

```bash
npm run dev
```

### Logs

Los logs se guardan automáticamente en:
- `logs/combined.log` - Todos los logs
- `logs/error.log` - Solo errores

También se muestran en consola con colores.

## ⚙️ Automatización con GitHub Actions

### Configuración

1. **Subir tu código a GitHub:**

```bash
git init
git add .
git commit -m "Initial commit: Auto Notion Scheduler"
git remote add origin <tu-repo-url>
git push -u origin master
```

2. **Configurar Secrets en GitHub:**

Ve a tu repositorio → Settings → Secrets and variables → Actions → New repository secret

Agrega los siguientes secrets:

- `NOTION_API_KEY`: Tu token de integración
- `TEMPLATE_DB_ID`: ID de Template DB
- `CALENDAR_DB_ID`: ID de Calendar DB

3. **El workflow se ejecutará automáticamente:**
   - Cada domingo a las 20:00 UTC (configurable en `.github/workflows/schedule.yml`)
   - También puedes ejecutarlo manualmente desde la pestaña "Actions" en GitHub

### Personalizar el horario

Edita `.github/workflows/schedule.yml`:

```yaml
on:
  schedule:
    - cron: '0 20 * * 0'  # Minuto Hora Día-mes Mes Día-semana
```

Ejemplos:
- `'0 18 * * 0'` - Domingo 18:00 UTC
- `'30 19 * * 0'` - Domingo 19:30 UTC
- `'0 12 * * 6'` - Sábado 12:00 UTC

## 🧩 Extensibilidad

La arquitectura está diseñada para ser fácilmente extensible:

### Agregar Google Calendar Sync

```javascript
// src/services/googleCalendarService.js
export async function syncToGoogleCalendar(events) {
  // Implementar sincronización
}

// En src/jobs/generateWeek.js
import { syncToGoogleCalendar } from '../services/googleCalendarService.js';

// Después de crear eventos en Notion:
await syncToGoogleCalendar(result.success);
```

### Agregar Planificación con IA

```javascript
// src/services/aiPlannerService.js
export async function generateSmartPlan(preferences) {
  // Usar OpenAI/Claude para generar plan personalizado
}
```

### Agregar Tracking de Hábitos

```javascript
// src/services/habitTrackerService.js
export async function trackHabits(completedTasks) {
  // Implementar tracking de hábitos
}
```

## 📝 Notas de Uso

### Días de la Semana

El sistema acepta los días en inglés:
- Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday

### Formato de Hora

Las horas deben estar en formato 24 horas: `HH:mm`
- Ejemplos: `05:00`, `14:30`, `23:45`

### Duración

La duración está en minutos:
- 60 = 1 hora
- 120 = 2 horas
- 540 = 9 horas

### Generación de Eventos

- El script calcula automáticamente la "próxima semana" desde el día actual
- Si hoy es domingo 20 de octubre → generará del 21 al 27 de octubre
- **No elimina ni modifica eventos pasados**
- Solo crea eventos nuevos

## 🐛 Solución de Problemas

### Error: "object_not_found"

- Verifica que los IDs de las bases de datos sean correctos
- Asegúrate de que las bases de datos existan

### Error: "unauthorized"

- Verifica que tu `NOTION_API_KEY` sea correcto
- Asegúrate de que el token empiece con `secret_`

### Error: "restricted_resource"

- La integración no tiene acceso a las bases de datos
- Ve a cada base de datos → Share → Invita a tu integración

### No se crean eventos

- Revisa los logs en `logs/combined.log`
- Verifica que tu Template DB tenga tareas
- Asegúrate de que las propiedades tengan los nombres exactos

### Problemas con fechas/horarios

- Verifica que el formato de hora sea `HH:mm`
- Revisa tu zona horaria en `.env`
- Asegúrate de que los días estén en inglés

## 🔒 Seguridad

- **Nunca** subas tu archivo `.env` a Git
- Usa GitHub Secrets para las credenciales en Actions
- Rota tu token de Notion periódicamente
- Limita los permisos de la integración solo a lo necesario

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Soporte

Si tienes problemas o preguntas:

1. Revisa la sección de "Solución de Problemas"
2. Consulta los logs en `logs/`
3. Abre un issue en GitHub

---

**Hecho con ❤️ para automatizar tu productividad**


