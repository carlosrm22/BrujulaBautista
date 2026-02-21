import { getDb } from './initDb';
import type { TaskRow } from './initDb.native';

export interface TaskInsert {
  titulo: string;
  definicion_done: string;
  donde_empieza: string;
  primer_paso: string;
  requiere_tecnica: number;
  tiempo_min: number;
}

export async function insertTask(row: TaskInsert): Promise<number> {
  const database = getDb();
  if (!database) throw new Error('DB not initialized');
  const result = await database.runAsync(
    `INSERT INTO tasks (titulo, definicion_done, donde_empieza, primer_paso, requiere_tecnica, tiempo_min, estado, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
    row.titulo,
    row.definicion_done,
    row.donde_empieza,
    row.primer_paso,
    row.requiere_tecnica,
    row.tiempo_min,
    Date.now()
  );
  return result.lastInsertRowId;
}

export async function updateTaskEstado(id: number, estado: string): Promise<void> {
  const database = getDb();
  if (!database) throw new Error('DB not initialized');
  await database.runAsync(`UPDATE tasks SET estado = ? WHERE id = ?`, estado, id);
}

export async function getPendingTasks(): Promise<TaskRow[]> {
  const database = getDb();
  if (!database) return [];
  const rows = await database.getAllAsync<TaskRow>(
    `SELECT * FROM tasks WHERE estado = 'pendiente' ORDER BY created_at DESC`
  );
  return rows;
}

export async function getCompletedTasks(limit = 100): Promise<TaskRow[]> {
  const database = getDb();
  if (!database) return [];
  const rows = await database.getAllAsync<TaskRow>(
    `SELECT * FROM tasks WHERE estado = 'completada' ORDER BY completed_at DESC LIMIT ?`,
    limit
  );
  return rows;
}

export async function completeTask(id: number, tiempoDedicado: number): Promise<void> {
  const database = getDb();
  if (!database) throw new Error('DB not initialized');
  await database.runAsync(
    `UPDATE tasks SET estado = 'completada', tiempo_dedicado = ?, completed_at = ? WHERE id = ?`,
    tiempoDedicado,
    Date.now(),
    id
  );
}

export async function deleteTask(id: number): Promise<void> {
  const database = getDb();
  if (!database) throw new Error('DB not initialized');
  await database.runAsync(`DELETE FROM tasks WHERE id = ?`, id);
}
