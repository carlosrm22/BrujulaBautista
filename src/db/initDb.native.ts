import * as SQLite from 'expo-sqlite';

const DB_NAME = 'brujula.db';

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

let db: SQLite.SQLiteDatabase | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  energia_fisica INTEGER NOT NULL,
  carga_sensorial INTEGER NOT NULL,
  carga_social INTEGER NOT NULL,
  ambiguedad INTEGER NOT NULL,
  ira INTEGER NOT NULL,
  semaforo_resultado TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  definicion_done TEXT NOT NULL,
  donde_empieza TEXT NOT NULL,
  primer_paso TEXT NOT NULL,
  requiere_tecnica INTEGER NOT NULL,
  tiempo_min INTEGER NOT NULL,
  estado TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS protocols (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  pasos_json TEXT NOT NULL,
  timers_json TEXT NOT NULL,
  orden INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS partner_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  texto TEXT NOT NULL,
  orden INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS social_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  fase TEXT NOT NULL,
  duracion TEXT,
  riesgo_sensorial TEXT,
  llevar_tapones INTEGER,
  costo_social REAL,
  costo_sensorial REAL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(SCHEMA);
  return db;
}

export function getDb(): SQLite.SQLiteDatabase | null {
  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
