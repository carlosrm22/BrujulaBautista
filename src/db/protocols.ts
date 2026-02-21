import { getDb } from './initDb';
import { DEFAULT_PROTOCOL_STEPS } from '../constants/protocols';

export interface Protocol {
  id: number;
  nombre: string;
  pasos: string[];
  timers: number[];
  orden: number;
}

export async function getAllProtocols(): Promise<Protocol[]> {
  const database = getDb();
  if (!database) return [];
  const rows = await database.getAllAsync<{ id: number; nombre: string; pasos_json: string; timers_json: string; orden: number }>(
    'SELECT id, nombre, pasos_json, timers_json, orden FROM protocols ORDER BY orden'
  );
  if (rows.length === 0) {
    await seedProtocols();
    return getAllProtocols();
  }
  type Row = { id: number; nombre: string; pasos_json: string; timers_json: string; orden: number };
  return rows.map((r: Row) => ({
    id: r.id,
    nombre: r.nombre,
    pasos: JSON.parse(r.pasos_json) as string[],
    timers: JSON.parse(r.timers_json) as number[],
    orden: r.orden,
  }));
}

async function seedProtocols(): Promise<void> {
  const database = getDb();
  if (!database) return;
  const names = [
    'Activación / enojo',
    'Post-social drenado',
    'Congelamiento por ambigüedad',
    'Sensorial',
  ];
  for (let index = 0; index < names.length; index++) {
    const nombre = names[index];
    const steps = DEFAULT_PROTOCOL_STEPS[nombre] ?? [];
    await database.runAsync(
      'INSERT INTO protocols (nombre, pasos_json, timers_json, orden) VALUES (?, ?, ?, ?)',
      nombre,
      JSON.stringify(steps),
      JSON.stringify([]),
      index
    );
  }
}

export async function getProtocolById(id: number): Promise<Protocol | null> {
  const database = getDb();
  if (!database) return null;
  const row = await database.getFirstAsync<{ id: number; nombre: string; pasos_json: string; timers_json: string; orden: number }>(
    'SELECT id, nombre, pasos_json, timers_json, orden FROM protocols WHERE id = ?',
    id
  );
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    pasos: JSON.parse(row.pasos_json) as string[],
    timers: JSON.parse(row.timers_json) as number[],
    orden: row.orden,
  };
}

export async function updateProtocolSteps(id: number, pasos: string[]): Promise<void> {
  const database = getDb();
  if (!database) throw new Error('DB not initialized');
  await database.runAsync('UPDATE protocols SET pasos_json = ? WHERE id = ?', JSON.stringify(pasos), id);
}
