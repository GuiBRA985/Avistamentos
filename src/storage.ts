import * as SQLite from 'expo-sqlite';
import * as FS from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
export type Sighting = { id:string; createdAt:string; animal:string; notes:string; photo:string; audio:string|null; latitude:number|null; longitude:number|null; accuracy:number|null; gpsAt:string|null; gpsStatus:string; status:'pending'; };
let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  if (!database) database = (async () => {
    const d = await SQLite.openDatabaseAsync('bento-pantanal.db');
    await d.execAsync(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS sightings (id TEXT PRIMARY KEY, payload TEXT NOT NULL);`);
    return d;
  })();
  return database;
}
export async function list():Promise<Sighting[]> {
 const rows=await (await db()).getAllAsync<{payload:string}>('SELECT payload FROM sightings ORDER BY rowid DESC');
 return rows.map(r=>JSON.parse(r.payload));
}
async function durable(uri:string,name:string) {
 if (!FS.documentDirectory) throw new Error('Armazenamento do aparelho indisponível.');
 const dir=FS.documentDirectory+'sightings/';
 await FS.makeDirectoryAsync(dir,{intermediates:true});
 const target=dir+name; await FS.copyAsync({from:uri,to:target}); return target;
}
export async function save(input:Omit<Sighting,'id'|'status'>) {
 const id=Crypto.randomUUID(); const copied:string[]=[];
 try {
   const photo=await durable(input.photo,id+'.jpg'); copied.push(photo);
   const audio=input.audio ? await durable(input.audio,id+'.m4a') : null;
   if(audio)copied.push(audio);
   const row:Sighting={...input,id,photo,audio,status:'pending'};
   await (await db()).runAsync('INSERT INTO sightings (id,payload) VALUES (?,?)',id,JSON.stringify(row));
   return row;
 } catch(e) { for(const uri of copied)await FS.deleteAsync(uri,{idempotent:true}).catch(()=>{}); throw e; }
}
export async function exportBackup() {
 if(!FS.cacheDirectory)throw new Error('Pasta temporária indisponível.');
 const rows=await list(); const path=FS.cacheDirectory+'bento-pantanal-backup.json';
 const backup={formatVersion:1,exportedAt:new Date().toISOString(),sightings:await Promise.all(rows.map(async r=>({...r,photoBase64:await FS.readAsStringAsync(r.photo,{encoding:FS.EncodingType.Base64}),audioBase64:r.audio?await FS.readAsStringAsync(r.audio,{encoding:FS.EncodingType.Base64}):null})))};
 await FS.writeAsStringAsync(path,JSON.stringify(backup)); return path;
}

export async function getLanguage():Promise<'pt'|'en'> {
 const d=await db();
 await d.execAsync('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
 const row=await d.getFirstAsync<{value:string}>('SELECT value FROM settings WHERE key=?','language');
 return row?.value==='en'?'en':'pt';
}
export async function setLanguage(value:'pt'|'en') {
 const d=await db();
 await d.execAsync('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
 await d.runAsync('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value','language',value);
}
