/**
 * Servicio de interacción con la API de Notion
 * Maneja todas las operaciones de lectura y escritura en Notion
 */

import { notionClient, databases } from '../config/notion.js';
import { createLogger } from '../utils/logger.js';
import { NotionError, processNotionError, retryOperation } from '../utils/errorHandler.js';

const logger = createLogger('NotionService');

/**
 * Obtiene todas las tareas/eventos de la base de datos de plantillas
 * @returns {Promise<Array>} Lista de tareas de plantilla
 */
export async function getTemplateTasks() {
  try {
    logger.info('Obteniendo tareas de la base de datos de plantillas...');
    
    const response = await retryOperation(async () => {
      return await notionClient.databases.query({
        database_id: databases.template,
        sorts: [
          {
            property: 'Day',
            direction: 'ascending',
          },
        ],
      });
    });
    
    const tasks = response.results.map(page => parseTemplatePage(page));
    
    logger.info(`Se obtuvieron ${tasks.length} tareas de plantilla`);
    return tasks;
    
  } catch (error) {
    const errorMessage = processNotionError(error);
    logger.error(`Error al obtener tareas de plantilla: ${errorMessage}`);
    throw new NotionError(`No se pudieron obtener las tareas de plantilla: ${errorMessage}`, error);
  }
}

/**
 * Parsea una página de Notion de la base de datos de plantillas
 * @param {Object} page - Objeto de página de Notion
 * @returns {Object} Objeto de tarea parseado
 */
function parseTemplatePage(page) {
  const properties = page.properties;
  
  return {
    id: page.id,
    name: extractTitle(properties.Name),
    day: extractSelect(properties.Day),
    time: extractText(properties.Time),
    duration: extractNumber(properties.Duration) || 60, // Default 60 minutos
    notes: extractText(properties.Notes) || '',
  };
}

/**
 * Crea un nuevo evento en la base de datos de calendario
 * @param {Object} eventData - Datos del evento a crear
 * @param {string} eventData.name - Nombre del evento
 * @param {Object} eventData.date - Objeto con fechas de inicio y fin
 * @param {string} eventData.notes - Notas del evento
 * @returns {Promise<Object>} Página creada en Notion
 */
export async function createCalendarEvent(eventData) {
  try {
    const { name, date, notes } = eventData;
    
    logger.debug(`Creando evento: ${name} - ${date.start}`);
    
    const response = await retryOperation(async () => {
      return await notionClient.pages.create({
        parent: {
          database_id: databases.calendar,
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: name,
                },
              },
            ],
          },
          Date: {
            date: {
              start: date.start,
              end: date.end,
              time_zone: date.time_zone || 'America/Mexico_City',
            },
          },
          Notes: {
            rich_text: [
              {
                text: {
                  content: notes || '',
                },
              },
            ],
          },
        },
      });
    });
    
    logger.debug(`Evento creado exitosamente: ${name}`);
    return response;
    
  } catch (error) {
    const errorMessage = processNotionError(error);
    logger.error(`Error al crear evento "${eventData.name}": ${errorMessage}`);
    throw new NotionError(`No se pudo crear el evento: ${errorMessage}`, error);
  }
}

/**
 * Crea múltiples eventos en batch
 * @param {Array<Object>} events - Lista de eventos a crear
 * @returns {Promise<Array>} Lista de eventos creados
 */
export async function createCalendarEventsBatch(events) {
  logger.info(`Creando ${events.length} eventos en el calendario...`);
  
  const results = [];
  const errors = [];
  
  for (const event of events) {
    try {
      const result = await createCalendarEvent(event);
      results.push(result);
    } catch (error) {
      errors.push({ event, error });
      logger.error(`Error al crear evento "${event.name}": ${error.message}`);
    }
  }
  
  if (errors.length > 0) {
    logger.warn(`Se crearon ${results.length} eventos, ${errors.length} fallaron`);
  } else {
    logger.info(`Se crearon exitosamente ${results.length} eventos`);
  }
  
  return {
    success: results,
    errors: errors,
  };
}

/**
 * Verifica la conectividad con Notion y valida permisos
 * @returns {Promise<boolean>} true si la conexión es exitosa
 */
export async function verifyConnection() {
  try {
    logger.info('Verificando conexión con Notion...');
    
    // Intentar obtener información de la base de datos de plantillas
    await notionClient.databases.retrieve({
      database_id: databases.template,
    });
    
    // Intentar obtener información de la base de datos de calendario
    await notionClient.databases.retrieve({
      database_id: databases.calendar,
    });
    
    logger.info('Conexión con Notion verificada exitosamente');
    return true;
    
  } catch (error) {
    const errorMessage = processNotionError(error);
    logger.error(`Error al verificar conexión: ${errorMessage}`);
    throw new NotionError(`Verificación de conexión fallida: ${errorMessage}`, error);
  }
}

// ===== Utilidades de extracción de propiedades =====

/**
 * Extrae el contenido de una propiedad de tipo título
 * @param {Object} property - Propiedad de Notion
 * @returns {string} Contenido del título
 */
function extractTitle(property) {
  if (!property || !property.title || property.title.length === 0) {
    return '';
  }
  return property.title[0].plain_text;
}

/**
 * Extrae el contenido de una propiedad de tipo select
 * @param {Object} property - Propiedad de Notion
 * @returns {string} Valor seleccionado
 */
function extractSelect(property) {
  if (!property || !property.select) {
    return '';
  }
  return property.select.name;
}

/**
 * Extrae el contenido de una propiedad de tipo texto
 * @param {Object} property - Propiedad de Notion
 * @returns {string} Contenido del texto
 */
function extractText(property) {
  if (!property || !property.rich_text || property.rich_text.length === 0) {
    return '';
  }
  return property.rich_text[0].plain_text;
}

/**
 * Extrae el contenido de una propiedad de tipo número
 * @param {Object} property - Propiedad de Notion
 * @returns {number|null} Valor numérico
 */
function extractNumber(property) {
  if (!property || property.number === null || property.number === undefined) {
    return null;
  }
  return property.number;
}

export default {
  getTemplateTasks,
  createCalendarEvent,
  createCalendarEventsBatch,
  verifyConnection,
};


