import { getDb } from './initDb';
import type { FocusSessionRow } from './initDb.native';

export type FocusSessionInsert = Omit<FocusSessionRow, 'id'>;

export async function startFocusSession(row: FocusSessionInsert): Promise<number> {
    const database = getDb();
    if (!database) throw new Error('DB not initialized');

    const result = await database.runAsync(
        `INSERT INTO focus_sessions (start_ts, label, linked_task_id, break_minutes, bedtime_minutes)
     VALUES (?, ?, ?, ?, ?)`,
        row.start_ts,
        row.label || null,
        row.linked_task_id || null,
        row.break_minutes || null,
        row.bedtime_minutes || null
    );
    return result.lastInsertRowId;
}

export async function closeFocusSession(
    id: number,
    end_ts: number,
    ended_reason: string,
    over_bedtime_minutes: number
): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('DB not initialized');

    await database.runAsync(
        `UPDATE focus_sessions 
     SET end_ts = ?, ended_reason = ?, over_bedtime_minutes = ? 
     WHERE id = ?`,
        end_ts,
        ended_reason,
        over_bedtime_minutes,
        id
    );
}

export async function getActiveFocusSession(): Promise<FocusSessionRow | null> {
    const database = getDb();
    if (!database) return null;
    const session = await database.getFirstAsync<FocusSessionRow>(
        `SELECT * FROM focus_sessions WHERE end_ts IS NULL ORDER BY start_ts DESC LIMIT 1`
    );
    return session;
}

export async function getFocusSessionsHistory(limit: number = 50): Promise<FocusSessionRow[]> {
    const database = getDb();
    if (!database) return [];
    const rows = await database.getAllAsync<FocusSessionRow>(
        `SELECT * FROM focus_sessions WHERE end_ts IS NOT NULL ORDER BY start_ts DESC LIMIT ?`,
        limit
    );
    return rows;
}
