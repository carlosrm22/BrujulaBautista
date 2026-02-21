import { getDb } from './initDb';
import type { SocialLogRow } from './initDb.native';

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

export async function getSocialLogs(limit = 100): Promise<SocialLogRow[]> {
  const database = getDb();
  if (!database) return [];
  const rows = await database.getAllAsync<SocialLogRow>(
    `SELECT * FROM social_logs ORDER BY timestamp DESC LIMIT ?`,
    limit
  );
  return rows;
}

export async function deleteSocialLog(id: number): Promise<void> {
  const database = getDb();
  if (!database) throw new Error('DB not initialized');
  await database.runAsync(`DELETE FROM social_logs WHERE id = ?`, id);
}
