import type { SemaphoreResult } from './initDb';
import { getDb } from './initDb';

export interface CheckInInsert {
  energia_fisica: number;
  carga_sensorial: number;
  carga_social: number;
  ambiguedad: number;
  ira: number;
  semaforo_resultado: SemaphoreResult;
}

export async function insertCheckIn(row: CheckInInsert): Promise<number> {
  const database = getDb();
  if (!database) throw new Error('DB not initialized');
  const result = await database.runAsync(
    `INSERT INTO checkins (timestamp, energia_fisica, carga_sensorial, carga_social, ambiguedad, ira, semaforo_resultado)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    Date.now(),
    row.energia_fisica,
    row.carga_sensorial,
    row.carga_social,
    row.ambiguedad,
    row.ira,
    row.semaforo_resultado
  );
  return result.lastInsertRowId;
}

export async function getLatestCheckIn(): Promise<CheckInInsert | null> {
  const database = getDb();
  if (!database) return null;
  const row = await database.getFirstAsync<{
    energia_fisica: number;
    carga_sensorial: number;
    carga_social: number;
    ambiguedad: number;
    ira: number;
    semaforo_resultado: SemaphoreResult;
  }>(
    `SELECT energia_fisica, carga_sensorial, carga_social, ambiguedad, ira, semaforo_resultado
     FROM checkins ORDER BY timestamp DESC LIMIT 1`
  );
  return row ?? null;
}

export interface CheckInWithTime extends CheckInInsert {
  id: number;
  timestamp: number;
}

export async function getAllCheckIns(limit = 100): Promise<CheckInWithTime[]> {
  const database = getDb();
  if (!database) return [];
  return database.getAllAsync<CheckInWithTime>(
    `SELECT id, timestamp, energia_fisica, carga_sensorial, carga_social, ambiguedad, ira, semaforo_resultado
     FROM checkins ORDER BY timestamp DESC LIMIT ?`,
    limit
  );
}

export async function getCheckInsByDateRange(
  from: number,
  to: number
): Promise<CheckInWithTime[]> {
  const database = getDb();
  if (!database) return [];
  return database.getAllAsync<CheckInWithTime>(
    `SELECT id, timestamp, energia_fisica, carga_sensorial, carga_social, ambiguedad, ira, semaforo_resultado
     FROM checkins WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC`,
    from,
    to
  );
}

export interface CheckInStats {
  total: number;
  avgEnergia: number;
  avgSensorial: number;
  avgSocial: number;
  avgAmbiguedad: number;
  countVerde: number;
  countAmarillo: number;
  countRojo: number;
}

export async function getCheckInStats(
  from?: number,
  to?: number
): Promise<CheckInStats> {
  const database = getDb();
  const empty: CheckInStats = {
    total: 0,
    avgEnergia: 0,
    avgSensorial: 0,
    avgSocial: 0,
    avgAmbiguedad: 0,
    countVerde: 0,
    countAmarillo: 0,
    countRojo: 0,
  };
  if (!database) return empty;

  let where = '';
  const params: number[] = [];
  if (from !== undefined && to !== undefined) {
    where = 'WHERE timestamp >= ? AND timestamp <= ?';
    params.push(from, to);
  }

  const row = await database.getFirstAsync<{
    total: number;
    avg_e: number;
    avg_s: number;
    avg_so: number;
    avg_a: number;
    c_verde: number;
    c_amarillo: number;
    c_rojo: number;
  }>(
    `SELECT
       COUNT(*) as total,
       COALESCE(AVG(energia_fisica), 0) as avg_e,
       COALESCE(AVG(carga_sensorial), 0) as avg_s,
       COALESCE(AVG(carga_social), 0) as avg_so,
       COALESCE(AVG(ambiguedad), 0) as avg_a,
       SUM(CASE WHEN semaforo_resultado = 'VERDE' THEN 1 ELSE 0 END) as c_verde,
       SUM(CASE WHEN semaforo_resultado = 'AMARILLO' THEN 1 ELSE 0 END) as c_amarillo,
       SUM(CASE WHEN semaforo_resultado = 'ROJO' THEN 1 ELSE 0 END) as c_rojo
     FROM checkins ${where}`,
    ...params
  );

  if (!row) return empty;
  return {
    total: row.total,
    avgEnergia: Math.round(row.avg_e * 10) / 10,
    avgSensorial: Math.round(row.avg_s * 10) / 10,
    avgSocial: Math.round(row.avg_so * 10) / 10,
    avgAmbiguedad: Math.round(row.avg_a * 10) / 10,
    countVerde: row.c_verde ?? 0,
    countAmarillo: row.c_amarillo ?? 0,
    countRojo: row.c_rojo ?? 0,
  };
}

export async function deleteCheckIn(id: number): Promise<void> {
  const database = getDb();
  if (!database) return;
  await database.runAsync('DELETE FROM checkins WHERE id = ?', id);
}

export async function keepOnlyLastNCheckIns(n: number = 3): Promise<void> {
  const database = getDb();
  if (!database) return;
  // Borrar todos los checkins cuyo ID no esté entre los N más recientes
  await database.runAsync(`
    DELETE FROM checkins 
    WHERE id NOT IN (
      SELECT id FROM checkins ORDER BY timestamp DESC LIMIT ?
    )
  `, n);
}


