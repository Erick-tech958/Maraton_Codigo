import {db} from './db.js';
let active=true;
async function stop(){active=false;await db.close();process.exit(0);}
process.once('SIGINT',stop);process.once('SIGTERM',stop);
console.log('Usuarios en MySQL. Actualización cada 2 segundos. Ctrl+C para salir.');
while(active){
 try {const rows=await db.all('SELECT id,name,email,role,created_at FROM users ORDER BY id DESC LIMIT 30');console.clear();console.log('MySQL · Últimos 30 usuarios · '+new Date().toLocaleTimeString()+' · Ctrl+C para salir');console.table(rows);}
 catch(e){console.error('No se pudo consultar MySQL:',e.code||e.message);await db.close();process.exit(1);}
 await new Promise(resolve=>setTimeout(resolve,2000));
}
