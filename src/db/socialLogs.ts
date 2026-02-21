import { getDb } from './initDb';

export interface SocialLogInsert {
  fase: 'antes' | 'despues';
  duracion?: string;
  riesgo_sensorial?: string;
  llevar_tapones?: number;
  costo_social?: number;
  costo_sensorial?: number;
}

export async function insertSocialLog(row: SocialLogInsert): Promise<number> {
  const database = getDb();
  if (!database) throw new Error('DB not initialized');
  const result = await database.runAsync(
    `INSERT INTO social_logs (timestamp, fase, duracion, riesgo_sensorial, llevar_tapones, costo_social, costo_sensorial)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    Date.now(),
    row.fase,
    row.duracion ?? null,
    row.riesgo_sensorial ?? null,
    row.llevar_tapones ?? null,
    row.costo_social ?? null,
    row.costo_sensorial ?? null
  );
  return result.lastInsertRowId;
}
