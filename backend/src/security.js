import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export const hash = password => { const salt=randomBytes(16).toString('hex'); return salt+':'+scryptSync(password,salt,64).toString('hex'); };
export const verify = (password, stored) => { const [salt,key]=stored.split(':'); return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(key,'hex')); };
export function category(birth,date) { let age=Number(date.slice(0,4))-Number(birth.slice(0,4)); if(date.slice(5)<birth.slice(5)) age--; return age<18?'infantil':age<60?'edad promedio':'tercera edad'; }
