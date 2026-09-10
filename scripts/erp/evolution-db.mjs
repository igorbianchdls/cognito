import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import pg from 'pg';
export const root=new URL('../../',import.meta.url);
export const project='mtadnxqoqxzbdksktwdr';
export function connection(){
 const env=dotenv.parse(readFileSync(new URL('.env.local',root)));
 const u=new URL(env.SUPABASE_DB_URL);
 assert.equal(u.username,'postgres.'+project); assert.equal(u.hostname,'aws-1-sa-east-1.pooler.supabase.com'); assert.equal(u.port,'5432');
 for(const k of ['sslmode','sslrootcert','sslcert','sslkey']) u.searchParams.delete(k);
 return new pg.Client({connectionString:u.toString(),ssl:{ca:readFileSync(new URL('certificates/supabase-prod-ca-2021.crt',root),'utf8'),rejectUnauthorized:true},connectionTimeoutMillis:15000,statement_timeout:60000,application_name:'creatto_evolution'});
}

