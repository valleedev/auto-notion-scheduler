/**
 * Punto de entrada principal de la aplicación
 * Auto Notion Scheduler - Automatización de planificación semanal
 */

import { createLogger } from './utils/logger.js';
import { generateWeek } from './jobs/generateWeek.js';
import config from './config/environment.js';

const logger = createLogger('Main');

/**
 * Función principal de la aplicación
 */
async function main() {
  try {
    logger.info('╔════════════════════════════════════════════════╗');
    logger.info('║   Auto Notion Scheduler                        ║');
    logger.info('║   Automatización de Planificación Semanal      ║');
    logger.info('╚════════════════════════════════════════════════╝');
    logger.info('');
    
    // Mostrar configuración (sin datos sensibles)
    logger.info('Configuración cargada:');
    logger.info(`  - Template DB: ${config.notion.templateDbId.substring(0, 8)}...`);
    logger.info(`  - Calendar DB: ${config.notion.calendarDbId.substring(0, 8)}...`);
    logger.info(`  - Timezone: ${config.timezone}`);
    logger.info(`  - Log Level: ${config.logging.level}`);
    logger.info('');
    
    // Ejecutar generación de semana
    const result = await generateWeek();
    
    // Mostrar resumen final
    if (result.success) {
      logger.info('');
      logger.info('✓ Proceso completado exitosamente');
      logger.info(`  - Eventos creados: ${result.created}`);
      if (result.failed > 0) {
        logger.warn(`  - Eventos fallidos: ${result.failed}`);
      }
      logger.info(`  - Duración: ${result.duration}s`);
    } else {
      logger.error('');
      logger.error('✗ Proceso completado con errores');
      logger.error(`  - Error: ${result.error}`);
    }
    
  } catch (error) {
    logger.error('Error fatal en la aplicación', error);
    process.exit(1);
  }
}

// Ejecutar aplicación
main();


