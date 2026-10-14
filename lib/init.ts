import { seedDatabase } from '@/lib/seed';

export function ensureDatabaseSeeded() {
  try {
    seedDatabase();
  } catch (e) {
    console.error('Error during auto seed check:', e);
  }
}
