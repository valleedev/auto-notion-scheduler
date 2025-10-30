/**
 * Utilidades para manejo de fechas y cálculos temporales
 * Usa date-fns para operaciones robustas con fechas
 */

import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  addMinutes,
  addHours,
  format,
  parse,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
} from 'date-fns';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Mapa de días de la semana en español a funciones de date-fns
 */
const dayFunctions = {
  'Monday': nextMonday,
  'Tuesday': nextTuesday,
  'Wednesday': nextWednesday,
  'Thursday': nextThursday,
  'Friday': nextFriday,
  'Saturday': nextSaturday,
  'Sunday': nextSunday,
  'Lunes': nextMonday,
  'Martes': nextTuesday,
  'Miércoles': nextWednesday,
  'Jueves': nextThursday,
  'Viernes': nextFriday,
  'Sábado': nextSaturday,
  'Domingo': nextSunday,
};

/**
 * Obtiene el inicio de la próxima semana (lunes)
 * @param {Date} [referenceDate=new Date()] - Fecha de referencia
 * @returns {Date} Inicio de la próxima semana
 */
export function getNextWeekStart(referenceDate = new Date()) {
  return startOfWeek(addWeeks(referenceDate, 1), { weekStartsOn: 1 }); // 1 = Lunes
}

/**
 * Obtiene el fin de la próxima semana (domingo)
 * @param {Date} [referenceDate=new Date()] - Fecha de referencia
 * @returns {Date} Fin de la próxima semana
 */
export function getNextWeekEnd(referenceDate = new Date()) {
  return endOfWeek(addWeeks(referenceDate, 1), { weekStartsOn: 1 });
}

/**
 * Convierte un string de hora (HH:mm) a un objeto Date en un día específico
 * @param {Date} baseDate - Fecha base para el día
 * @param {string} timeString - Hora en formato "HH:mm" (ej: "05:00", "14:30")
 * @param {string} timezone - Zona horaria (opcional, por defecto America/Bogota)
 * @returns {Date} Fecha con la hora especificada en la zona horaria correcta
 */
export function parseTimeToDate(baseDate, timeString, timezone = 'America/Bogota') {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Crear una nueva fecha basada en la fecha base
  let date = new Date(baseDate);
  
  // Establecer la hora directamente (sin conversiones de zona horaria)
  date = setHours(date, hours);
  date = setMinutes(date, minutes);
  date = setSeconds(date, 0);
  date = setMilliseconds(date, 0);
  
  // Retornar la fecha con la hora especificada
  return date;
}

/**
 * Calcula la fecha de fin sumando la duración a la fecha de inicio
 * @param {Date} startDate - Fecha y hora de inicio
 * @param {number} duration - Duración en minutos
 * @returns {Date} Fecha y hora de fin
 */
export function calculateEndDate(startDate, duration) {
  return addMinutes(startDate, duration);
}

/**
 * Obtiene la fecha del próximo día de la semana especificado
 * @param {Date} referenceDate - Fecha de referencia (por defecto, próximo lunes)
 * @param {string} dayName - Nombre del día (Monday, Tuesday, etc. o en español)
 * @returns {Date} Fecha del día especificado en la próxima semana
 */
export function getNextWeekDay(referenceDate, dayName) {
  const dayFunction = dayFunctions[dayName];
  
  if (!dayFunction) {
    throw new Error(`Día no válido: ${dayName}`);
  }
  
  // Si la referencia es el inicio de la próxima semana (lunes)
  // calculamos el día específico desde ahí
  return dayFunction(referenceDate);
}

/**
 * Convierte un día de la semana a su índice (0 = Domingo, 1 = Lunes, etc.)
 * @param {string} dayName - Nombre del día
 * @returns {number} Índice del día
 */
export function dayNameToIndex(dayName) {
  const days = {
    'Sunday': 0, 'Domingo': 0,
    'Monday': 1, 'Lunes': 1,
    'Tuesday': 2, 'Martes': 2,
    'Wednesday': 3, 'Miércoles': 3,
    'Thursday': 4, 'Jueves': 4,
    'Friday': 5, 'Viernes': 5,
    'Saturday': 6, 'Sábado': 6,
  };
  
  return days[dayName] ?? -1;
}

/**
 * Obtiene el día específico de la próxima semana basado en el nombre del día
 * @param {string} dayName - Nombre del día (Monday, Tuesday, etc.)
 * @returns {Date} Fecha del día en la próxima semana
 */
export function getNextWeekDayDate(dayName) {
  const nextWeekStart = getNextWeekStart();
  const dayIndex = dayNameToIndex(dayName);
  
  if (dayIndex === -1) {
    throw new Error(`Día no válido: ${dayName}`);
  }
  
  // El inicio de semana es lunes (índice 1)
  // Calculamos la diferencia de días
  let daysToAdd = dayIndex - 1; // -1 porque nextWeekStart ya es lunes
  if (daysToAdd < 0) daysToAdd += 7; // Si es domingo, sumamos 6 días desde el lunes
  
  const targetDate = new Date(nextWeekStart);
  targetDate.setDate(targetDate.getDate() + daysToAdd);
  
  // Establecer la hora a medianoche (00:00) para evitar problemas de zona horaria
  targetDate.setHours(0, 0, 0, 0);
  
  return targetDate;
}

/**
 * Formatea una fecha para Notion (ISO 8601)
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada para Notion
 */
export function formatForNotion(date) {
  return date.toISOString();
}

/**
 * Crea un objeto de fecha compatible con Notion API
 * @param {Date} startDate - Fecha de inicio (en hora local)
 * @param {Date} endDate - Fecha de fin (en hora local)
 * @param {string} timezone - Zona horaria para Notion
 * @returns {Object} Objeto de fecha para Notion
 */
export function createNotionDateObject(startDate, endDate, timezone = 'America/Bogota') {
  // Notion interpreta las fechas ISO como UTC, así que necesitamos ajustar
  // Si queremos 05:00 en Colombia (UTC-5), necesitamos enviar 05:00 UTC
  // Pero como Notion lo interpreta como UTC, necesitamos restar 5 horas
  const offsetHours = -1; // Colombia está 5 horas detrás de UTC
  
  // Crear fechas ajustadas para compensar la diferencia de zona horaria
  const adjustedStart = new Date(startDate.getTime() + (offsetHours * 60 * 60 * 1000));
  const adjustedEnd = new Date(endDate.getTime() + (offsetHours * 60 * 60 * 1000));
  
  return {
    start: formatForNotion(adjustedStart),
    end: formatForNotion(adjustedEnd),
    time_zone: timezone, // Especificar la zona horaria para Notion
  };
}

/**
 * Obtiene todas las fechas de la próxima semana (lunes a domingo)
 * @returns {Object} Objeto con los días de la semana y sus fechas
 */
export function getNextWeekDates() {
  const nextWeekStart = getNextWeekStart();
  
  return {
    Monday: getNextWeekDayDate('Monday'),
    Tuesday: getNextWeekDayDate('Tuesday'),
    Wednesday: getNextWeekDayDate('Wednesday'),
    Thursday: getNextWeekDayDate('Thursday'),
    Friday: getNextWeekDayDate('Friday'),
    Saturday: getNextWeekDayDate('Saturday'),
    Sunday: getNextWeekDayDate('Sunday'),
  };
}

export default {
  getNextWeekStart,
  getNextWeekEnd,
  parseTimeToDate,
  calculateEndDate,
  getNextWeekDay,
  getNextWeekDayDate,
  formatForNotion,
  createNotionDateObject,
  getNextWeekDates,
};


