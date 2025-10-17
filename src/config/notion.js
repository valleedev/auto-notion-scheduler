/**
 * Configuración del cliente de Notion
 * Inicializa y exporta el cliente de la API de Notion
 */

import { Client } from '@notionhq/client';
import config from './environment.js';

/**
 * Cliente de Notion inicializado con las credenciales del entorno
 */
export const notionClient = new Client({
  auth: config.notion.apiKey,
});

/**
 * IDs de las bases de datos de Notion
 */
export const databases = {
  template: config.notion.templateDbId,
  calendar: config.notion.calendarDbId,
};

export default notionClient;


