import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import mysql from 'mysql2/promise';
import {readFileSync} from 'node:fs';
test('MySQL: roles, folio, duplicados, cupo y privacidad',{skip:process.env.RUN_MYSQL_TESTS!=='true'},async()=>{
 const database='corre_test_'+Date.now();
 const setup=await mysql.createConnection({host:process.env.MYSQL_HOST||'127.0.0.1',port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,multipleStatements:true});
 await setup.query(readFileSync('database/schema.sql','utf8').replaceAll('carreras_db',database));
 const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
 const env={...process.env,MYSQL_DATABASE:database,JWT_SECRET:'test-secret-only-for-automated-tests-123456',PORT:String(port),ADMIN_NAME:'Admin prueba',ADMIN_EMAIL:'admin@test.local',ADMIN_PASSWORD:'Password-test-12345'};
 const init=spawnSync(process.execPath,['src/init-db.js'],{env,encoding:'utf8'});assert.equal(init.status,0,init.stderr);
 const child=spawn(process.execPath,['src/server.js'],{env,stdio:'pipe'});let logs='';child.stderr.on('data',d=>logs+=d);child.stdout.on('data',d=>logs+=d);
 const base=`http://127.0.0.1:${port}/api`;
 async function req(path,method='GET',body,token){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
 const person=(name,email,birth_date='2000-01-01')=>({name,email,birth_date,password:'Password-test-12345'});
 const login=async email=>{const r=await req('/auth/login','POST',{email,password:'Password-test-12345'});assert.equal(r.status,200);return r.data.token;};
 try{
 let ready=false;for(let i=0;i<100;i++){try{if((await req('/health')).status===200){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,50));}assert.ok(ready,logs);
 const admin=await login('admin@test.local');
 assert.equal((await req('/users','POST',{...person('Organizador','org@test.local'),role:'organizador'},admin)).status,201);
 assert.equal((await req('/users','POST',{...person('Otro organizador','other@test.local'),role:'organizador'},admin)).status,201);
 const org=await login('org@test.local'),other=await login('other@test.local');
 assert.equal((await req('/auth/register','POST',{...person('Participante','p@test.local','2085-01-01'),role:'admin'})).status,400);
 assert.equal((await req('/auth/register','POST',{...person('Participante','p@test.local'),role:'admin'})).data.role,'participante');
 const participant=await login('p@test.local');
 assert.equal((await req('/users','GET',null,participant)).status,403);
 const race={title:'Carrera de prueba',location:'CDMX',date:'2099-10-28',description:'Prueba',capacity:1,distances:[5,10,15,20,42.195]};
 assert.equal((await req('/races','POST',race,participant)).status,403);
 assert.equal((await req('/races','POST',race,org)).status,201);
 const event=(await req('/races')).data[0];
 assert.equal((await req('/registrations','POST',{race_id:event.id,distance_id:99999},participant)).status,400);
 const registered=await req('/registrations','POST',{race_id:event.id,distance_id:event.distances[0].id},participant);assert.equal(registered.status,201);assert.match(registered.data.folio,/^RUN-/);assert.equal(registered.data.category,'tercera edad');
 assert.equal((await req('/registrations','POST',{race_id:event.id,distance_id:event.distances[0].id},participant)).status,409);
 assert.equal((await req('/registrations','GET',null,org)).data.length,1);assert.equal((await req('/registrations','GET',null,other)).data.length,0);
 const rows=(await req('/registrations','GET',null,participant)).data;assert.equal(rows[0].folio,registered.data.folio);
 await req('/auth/register','POST',person('Segundo','p2@test.local'));const second=await login('p2@test.local');
 assert.equal((await req('/registrations','POST',{race_id:event.id,distance_id:event.distances[0].id},second)).status,409);
 assert.equal((await req('/registrations','GET',null,second)).data.length,0);
 assert.equal((await req('/users')).status,401);
 // Dos solicitudes simultáneas al último lugar: exactamente una se confirma.
 assert.equal((await req('/races','POST',{...race,title:'Último lugar'},org)).status,201);
 const last=(await req('/races')).data.find(r=>r.title==='Último lugar');
 const pair=await Promise.all([participant,second].map(t=>req('/registrations','POST',{race_id:last.id,distance_id:last.distances[0].id},t)));
 assert.deepEqual(pair.map(r=>r.status).sort(),[201,409]);
 const [stored]=await setup.query('SELECT folio FROM registrations WHERE folio=?',[registered.data.folio]);assert.equal(stored.length,1);

 }finally{const stopped=once(child,'exit');child.kill();await stopped;await setup.query('DROP DATABASE `'+database+'`');await setup.end();}
});
