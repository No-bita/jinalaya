import { SQLiteTempleRepository } from './src/lib/db/sqlite-repository';

const repo = new SQLiteTempleRepository();
repo.getAll({ limit: 10 }).then(temples => {
  console.log("Total temples:", temples.length);
  temples.forEach(t => {
    console.log(`- ${t.name}: Lat: ${t.latitude}, Lng: ${t.longitude}, Maps URL: ${t.google_maps_url}`);
  });
}).catch(console.error);
