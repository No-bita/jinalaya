import { SQLiteTempleRepository } from './src/lib/db/sqlite-repository';
const repo = new SQLiteTempleRepository();
repo.getAll().then(console.log).catch(console.error);
