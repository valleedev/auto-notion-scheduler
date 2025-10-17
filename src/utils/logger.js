/**
 * Sistema de logging centralizado usando Winston
 * Proporciona logging estructurado con diferentes niveles
 */

import winston from 'winston';
import config from '../config/environment.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Formato personalizado para los logs
 */
const customFormat = printf(({ level, message, timestamp, stack }) => {
  if (stack) {
    return `${timestamp} [${level}]: ${message}\n${stack}`;
  }
  return `${timestamp} [${level}]: ${message}`;
});

/**
 * Logger principal de la aplicación
 */
export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    // Consola con colores
    new winston.transports.Console({
      format: combine(
        colorize(),
        customFormat
      ),
    }),
    // Archivo para todos los logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(
        timestamp(),
        customFormat
      ),
    }),
    // Archivo solo para errores
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(
        timestamp(),
        customFormat
      ),
    }),
  ],
});

/**
 * Crea un logger con un contexto específico
 * @param {string} context - Contexto del logger (ej: 'NotionService', 'GenerateWeek')
 * @returns {Object} Logger con contexto
 */
export function createLogger(context) {
  return {
    info: (message) => logger.info(`[${context}] ${message}`),
    error: (message, error) => {
      const errorMessage = error instanceof Error ? error.message : error;
      logger.error(`[${context}] ${message}`, error instanceof Error ? error : undefined);
    },
    warn: (message) => logger.warn(`[${context}] ${message}`),
    debug: (message) => logger.debug(`[${context}] ${message}`),
  };
}

export default logger;


