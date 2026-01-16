import { mockNightPrograms } from '@/mocks/admin';
import type { NightProgram } from './types';

export function fetchNightPrograms() {
  return Promise.resolve<NightProgram[]>(mockNightPrograms);
}

export function fetchNightProgramById(id: string) {
  return Promise.resolve<NightProgram | undefined>(
    mockNightPrograms.find((item) => item.id === id),
  );
}
