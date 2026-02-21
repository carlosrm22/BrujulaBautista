/**
 * Punto de entrada: en web usa initDb.web (sin SQLite), en native usa initDb.native.
 * TypeScript resuelve tipos desde .native.
 */
import { Platform } from 'react-native';
import type * as NativeDb from './initDb.native';

export type {
  SemaphoreResult,
  CheckInRow,
  TaskRow,
  ProtocolRow,
  PartnerTemplateRow,
  SocialLogRow,
} from './initDb.native';

const mod: typeof NativeDb =
  Platform.OS === 'web' ? require('./initDb.web') : require('./initDb.native');

export const initDb = mod.initDb;
export const getDb = mod.getDb;
export const closeDb = mod.closeDb;
