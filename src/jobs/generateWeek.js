/**
 * Job principal: Generación de la semana en Notion
 * 
 * Este módulo contiene la lógica principal para:
 * 1. Obtener las tareas de plantilla desde Template DB
 * 2. Calcular las fechas de la próxima semana
 * 3. Crear eventos en Calendar DB con las fechas calculadas
 */

import { createLogger } from '../utils/logger.js';
import {
  getTemplateTasks,
  createCalendarEventsBatch,
  verifyConnection,
} from '../services/notionService.js';
import {
  getNextWeekDayDate,
  parseTimeToDate,
  calculateEndDate,
  createNotionDateObject,
} from '../utils/dateHelper.js';
import { handleError } from '../utils/errorHandler.js';

const logger = createLogger('GenerateWeek');

/**
 * Transforma una tarea de plantilla en un evento de calendario con fechas reales
 * @param {Object} task - Tarea de plantilla
 * @returns {Object} Evento listo para crear en Calendar DB
 */
function transformTaskToEvent(task) {
  try {
    // Obtener la fecha del día correspondiente en la próxima semana
    const dayDate = getNextWeekDayDate(task.day);
    
    // Parsear la hora y crear la fecha de inicio completa
    const startDate = parseTimeToDate(dayDate, task.time);
    
    // Calcular la fecha de fin basada en la duración
    const endDate = calculateEndDate(startDate, task.duration);
    
    // Crear el objeto de fecha compatible con Notion
    const notionDate = createNotionDateObject(startDate, endDate);
    
    return {
      name: task.name,
      date: notionDate,
      notes: task.notes || `Generado automáticamente desde plantilla`,
    };
  } catch (error) {
    logger.error(`Error al transformar tarea "${task.name}": ${error.message}`);
    throw error;
  }
}

/**
 * Función principal que ejecuta la generación de la semana
 * @returns {Promise<Object>} Resultado de la operación con estadísticas
 */
export async function generateWeek() {
  const startTime = Date.now();
  
  try {
    logger.info('========================================');
    logger.info('Iniciando generación de semana en Notion');
    logger.info('========================================');
    
    // Paso 1: Verificar conexión con Notion
    logger.info('Paso 1/4: Verificando conexión con Notion...');
    await verifyConnection();
    logger.info('✓ Conexión verificada');
    
    // Paso 2: Obtener tareas de plantilla
    logger.info('Paso 2/4: Obteniendo tareas de plantilla...');
    const templateTasks = await getTemplateTasks();
    
    if (templateTasks.length === 0) {
      logger.warn('No se encontraron tareas en la base de datos de plantillas');
      return {
        success: true,
        created: 0,
        failed: 0,
        message: 'No hay tareas de plantilla para procesar',
      };
    }
    
    logger.info(`✓ Se encontraron ${templateTasks.length} tareas de plantilla`);
    
    // Paso 3: Transformar tareas a eventos con fechas reales
    logger.info('Paso 3/4: Transformando tareas a eventos...');
    const events = [];
    const transformErrors = [];
    
    for (const task of templateTasks) {
      try {
        const event = transformTaskToEvent(task);
        events.push(event);
      } catch (error) {
        transformErrors.push({ task, error });
      }
    }
    
    logger.info(`✓ ${events.length} eventos preparados para creación`);
    
    if (transformErrors.length > 0) {
      logger.warn(`⚠ ${transformErrors.length} tareas tuvieron errores de transformación`);
    }
    
    // Paso 4: Crear eventos en Calendar DB
    logger.info('Paso 4/4: Creando eventos en Calendar DB...');
    const result = await createCalendarEventsBatch(events);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.info('========================================');
    logger.info('Generación de semana completada');
    logger.info(`✓ Eventos creados: ${result.success.length}`);
    if (result.errors.length > 0) {
      logger.warn(`⚠ Eventos fallidos: ${result.errors.length}`);
    }
    logger.info(`Tiempo total: ${duration}s`);
    logger.info('========================================');
    
    return {
      success: true,
      created: result.success.length,
      failed: result.errors.length,
      duration: duration,
      errors: result.errors.map(e => ({
        event: e.event.name,
        error: e.error.message,
      })),
    };
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.error('========================================');
    logger.error('Error en la generación de semana');
    logger.error(`Tiempo transcurrido: ${duration}s`);
    logger.error('========================================');
    
    handleError(error, 'GenerateWeek');
    
    return {
      success: false,
      created: 0,
      failed: 0,
      duration: duration,
      error: error.message,
    };
  }
}

/**
 * Ejecuta el job si este archivo se ejecuta directamente
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  generateWeek()
    .then(result => {
      if (result.success) {
        logger.info('Job ejecutado exitosamente');
        process.exit(0);
      } else {
        logger.error('Job falló');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Error fatal en la ejecución del job');
      process.exit(1);
    });
}

export default generateWeek;


