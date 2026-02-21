import type { SemaphoreResult } from '../db/initDb';

export const SEMAFORO_COPY: Record<SemaphoreResult, string> = {
  VERDE: 'Sigue. No optimices.',
  AMARILLO: 'Reduce estímulo. Arranca pequeño.',
  ROJO: 'Descarga primero. Luego decide.',
};

export function computeSemaphore(
  energia_fisica: number,
  carga_sensorial: number,
  carga_social: number,
  ambiguedad: number
): SemaphoreResult {
  if (energia_fisica <= 2 || carga_sensorial >= 8 || carga_social >= 8 || ambiguedad >= 9) {
    return 'ROJO';
  }
  if (energia_fisica <= 4 || (carga_sensorial >= 6 && carga_sensorial <= 7) || (carga_social >= 6 && carga_social <= 7)) {
    return 'AMARILLO';
  }
  return 'VERDE';
}
