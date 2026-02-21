import { getDb } from './initDb';

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
