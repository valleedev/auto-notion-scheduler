/**
 * Configuración de variables de entorno
 * Carga y valida todas las variables necesarias para la aplicación
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Obtener el directorio actual en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde .env
dotenv.config({ path: resolve(__dirname, '../../.env') });

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 * @throws {Error} Si falta alguna variable requerida
 */
function validateEnvironment() {
  const required = [
    'NOTION_API_KEY',
    'TEMPLATE_DB_ID',
    'CALENDAR_DB_ID'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missing.join(', ')}\n` +
      'Por favor, revisa tu archivo .env'
    );
  }
}

// Validar al cargar el módulo
validateEnvironment();

/**
 * Configuración centralizada de la aplicación
 */
export const config = {
  notion: {
    apiKey: process.env.NOTION_API_KEY,
    templateDbId: process.env.TEMPLATE_DB_ID,
    calendarDbId: process.env.CALENDAR_DB_ID,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  timezone: process.env.TIMEZONE || 'UTC',
};

export default config;


