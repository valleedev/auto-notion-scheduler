/**
 * Manejo centralizado de errores
 * Proporciona funciones para capturar, procesar y reportar errores
 */

import { logger } from './logger.js';

/**
 * Clase personalizada para errores de Notion
 */
export class NotionError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'NotionError';
    this.originalError = originalError;
  }
}

/**
 * Clase personalizada para errores de validación
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Maneja errores de manera centralizada
 * @param {Error} error - Error a manejar
 * @param {string} context - Contexto donde ocurrió el error
 * @throws {Error} Re-lanza el error después de loguearlo
 */
export function handleError(error, context = 'Unknown') {
  const errorMessage = error.message || 'Error desconocido';
  
  logger.error(`[${context}] Error: ${errorMessage}`, error);
  
  // Aquí podrías agregar lógica adicional como:
  // - Enviar notificaciones
  // - Almacenar en base de datos
  // - Integrar con servicios de monitoreo (Sentry, etc.)
  
  throw error;
}

/**
 * Wrapper para funciones asíncronas que maneja errores automáticamente
 * @param {Function} fn - Función asíncrona a ejecutar
 * @param {string} context - Contexto de ejecución
 * @returns {Function} Función wrapped con manejo de errores
 */
export function asyncErrorHandler(fn, context) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
    }
  };
}

/**
 * Valida que un objeto tenga las propiedades requeridas
 * @param {Object} obj - Objeto a validar
 * @param {string[]} requiredFields - Campos requeridos
 * @param {string} context - Contexto para el mensaje de error
 * @throws {ValidationError} Si faltan campos requeridos
 */
export function validateRequiredFields(obj, requiredFields, context = 'Object') {
  const missing = requiredFields.filter(field => !obj[field]);
  
  if (missing.length > 0) {
    throw new ValidationError(
      `${context} - Campos requeridos faltantes: ${missing.join(', ')}`,
      missing[0]
    );
  }
}

/**
 * Procesa errores de la API de Notion y los convierte en mensajes amigables
 * @param {Error} error - Error de Notion
 * @returns {string} Mensaje de error procesado
 */
export function processNotionError(error) {
  if (error.code === 'object_not_found') {
    return 'Base de datos o página no encontrada. Verifica los IDs en tu .env';
  }
  
  if (error.code === 'unauthorized') {
    return 'Token de API inválido o sin permisos. Verifica tu NOTION_API_KEY';
  }
  
  if (error.code === 'restricted_resource') {
    return 'La integración no tiene acceso a este recurso. Comparte la base de datos con tu integración';
  }
  
  if (error.code === 'validation_error') {
    return `Error de validación: ${error.message}`;
  }
  
  return error.message || 'Error desconocido de Notion';
}

/**
 * Retry logic para operaciones que pueden fallar temporalmente
 * @param {Function} fn - Función a reintentar
 * @param {number} maxRetries - Número máximo de reintentos
 * @param {number} delay - Delay entre reintentos en ms
 * @returns {Promise} Resultado de la función
 */
export async function retryOperation(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logger.warn(`Intento ${i + 1}/${maxRetries} falló: ${error.message}`);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

export default {
  NotionError,
  ValidationError,
  handleError,
  asyncErrorHandler,
  validateRequiredFields,
  processNotionError,
  retryOperation,
};


