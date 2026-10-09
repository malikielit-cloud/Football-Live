import { DatabaseAdapter } from './databaseAdapter';
import { JsonFileAdapter } from './jsonFileAdapter';
import { GoogleSheetsAdapter } from './googleSheetsAdapter';

let instance: DatabaseAdapter | null = null;

export async function getDatabaseAdapter(): Promise<DatabaseAdapter> {
  if (instance) return instance;

  const adapterType = process.env.DB_ADAPTER || 'file';

  if (adapterType === 'sheets') {
    instance = new GoogleSheetsAdapter();
  } else {
    instance = new JsonFileAdapter();
  }

  await instance.init();
  return instance;
}

export * from './databaseAdapter';
export * from './jsonFileAdapter';
export * from './googleSheetsAdapter';
