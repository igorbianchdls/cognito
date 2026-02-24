require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')
async function main(){ const c=new Client({connectionString:process.env.SUPABASE_DB_URL, ssl:{rejectUnauthorized:false}}); await c.connect(); const rows=(await c.query(`select table_schema, table_name, column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='financeiro' and table_name in ('contas_pagar','contas_receber') order by table_name, ordinal_position`)).rows; console.log(JSON.stringify(rows,null,2)); await c.end(); }
main().catch(e=>{console.error('ERR',e.message); process.exit(1)})
