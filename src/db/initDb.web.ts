/**
 * Stub para web: expo-sqlite no está disponible en el navegador.
 * La app debe usarse en móvil con Expo Go.
 */

export type SemaphoreResult = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface CheckInRow {
  id: number;
  timestamp: number;
  energia_fisica: number;
  carga_sensorial: number;
  carga_social: number;
  ambiguedad: number;
  ira: number;
  semaforo_resultado: SemaphoreResult;
}

export interface TaskRow {
  id: number;
  titulo: string;
  definicion_done: string;
  donde_empieza: string;
  primer_paso: string;
  requiere_tecnica: number;
  tiempo_min: number;
  estado: string;
  created_at: number;
}

export interface ProtocolRow {
  id: number;
  nombre: string;
  pasos_json: string;
  timers_json: string;
  orden: number;
}

export interface PartnerTemplateRow {
  id: number;
  tipo: 'pedido' | 'accion';
  texto: string;
  orden: number;
}

export interface SocialLogRow {
  id: number;
  timestamp: number;
  fase: 'antes' | 'despues';
  duracion?: string;
  riesgo_sensorial?: string;
  llevar_tapones?: number;
  costo_social?: number;
  costo_sensorial?: number;
}

let db: null = null;

export async function initDb(): Promise<null> {
  return db;
}

export function getDb(): null {
  return db;
}

export async function closeDb(): Promise<void> {
  db = null;
}
