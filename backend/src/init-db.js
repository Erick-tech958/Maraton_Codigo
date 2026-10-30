import { db, hash } from './db.js';
const {ADMIN_NAME,ADMIN_EMAIL,ADMIN_PASSWORD}=process.env;
if(!ADMIN_NAME || !ADMIN_EMAIL || !/^\S+@\S+\.\S+$/.test(ADMIN_EMAIL) || !ADMIN_PASSWORD || ADMIN_PASSWORD.length<12 || ADMIN_PASSWORD.length>128 || ADMIN_PASSWORD==='CAMBIA_ESTA_CLAVE') throw new Error('Configura ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD (12 a 128 caracteres) en .env');
if((await db.one('SELECT id FROM users WHERE role=?', 'admin'))) console.log('Ya existe un administrador. No se modificó su contraseña.');
else {(await db.run('INSERT INTO users(name,email,password_hash,role,birth_date) VALUES(?,?,?,?,?)', ADMIN_NAME,ADMIN_EMAIL.trim().toLowerCase(),hash(ADMIN_PASSWORD),'admin','1990-01-01')); console.log('Base de datos y administrador creados.');}
await db.close();
