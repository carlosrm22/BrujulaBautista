import { getDb } from './initDb';
import { DEFAULT_PEDIDOS, DEFAULT_ACCIONES } from '../constants/partnerCopy';

export interface PartnerTemplate {
  id: number;
  tipo: 'pedido' | 'accion';
  texto: string;
  orden: number;
}

export async function getPartnerTemplates(): Promise<PartnerTemplate[]> {
  const database = getDb();
  if (!database) return [];
  const rows = await database.getAllAsync<PartnerTemplate>(
    'SELECT id, tipo, texto, orden FROM partner_templates ORDER BY tipo, orden'
  );
  if (rows.length === 0) {
    await seedPartnerTemplates();
    return getPartnerTemplates();
  }
  return rows;
}

async function seedPartnerTemplates(): Promise<void> {
  const database = getDb();
  if (!database) return;
  let orden = 0;
  for (const texto of DEFAULT_PEDIDOS) {
    await database.runAsync(
      'INSERT INTO partner_templates (tipo, texto, orden) VALUES (?, ?, ?)',
      'pedido',
      texto,
      orden++
    );
  }
  orden = 0;
  for (const texto of DEFAULT_ACCIONES) {
    await database.runAsync(
      'INSERT INTO partner_templates (tipo, texto, orden) VALUES (?, ?, ?)',
      'accion',
      texto,
      orden++
    );
  }
}

export async function updatePartnerTemplate(id: number, texto: string): Promise<void> {
  const database = getDb();
  if (!database) throw new Error('DB not initialized');
  await database.runAsync('UPDATE partner_templates SET texto = ? WHERE id = ?', texto, id);
}
