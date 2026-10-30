import 'dotenv/config';
import mysql from 'mysql2/promise';
import { AsyncLocalStorage } from 'node:async_hooks';
export { hash, verify, category } from './security.js';
const context = new AsyncLocalStorage();
export const pool = mysql.createPool({
 host: process.env.MYSQL_HOST || '127.0.0.1',
 port: Number(process.env.MYSQL_PORT || 3306),
 user: process.env.MYSQL_USER,
 password: process.env.MYSQL_PASSWORD,
 database: process.env.MYSQL_DATABASE || 'carreras_db',
 waitForConnections: true, connectionLimit: 10, queueLimit: 100,
 dateStrings: true, decimalNumbers: true, charset: 'utf8mb4',
 ...(process.env.MYSQL_SSL === 'true' ? {ssl: {rejectUnauthorized: true}} : {})
});
async function execute(sql, params) {
 const connection = context.getStore()?.connection || pool;
 const [rows] = await connection.execute(sql, params);
 return rows;
}
export const db = {
 // Aísla la conexión transaccional de cada petición HTTP.
 scope(req,res,next) { context.run({},next); },
 async one(sql,...params) { return (await execute(sql,params))[0]; },
 async all(sql,...params) { return execute(sql,params); },
 async run(sql,...params) { const result=await execute(sql,params); return result; },
 async exec(action) {
  const store=context.getStore();
  if (!store) throw new Error('Transacción fuera de contexto');
  if(action==='BEGIN') {
   store.connection=await pool.getConnection();
   try { await store.connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED'); await store.connection.beginTransaction(); }
   catch(e) {store.connection.release();delete store.connection;throw e;}
  } else {
   const connection=store.connection;
   if(!connection) return;
   try { if(action==='COMMIT') await connection.commit(); else await connection.rollback(); }
   finally {connection.release();delete store.connection;}
  }
 },
 async close(){await pool.end();}
};
