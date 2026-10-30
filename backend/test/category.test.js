import {test} from 'node:test';
import assert from 'node:assert/strict';
import {category,hash,verify} from '../src/security.js';
test('Categorías en los cumpleaños 18 y 60',()=>{assert.equal(category('2008-10-29','2026-10-28'),'infantil');assert.equal(category('2008-10-28','2026-10-28'),'edad promedio');assert.equal(category('1966-10-29','2026-10-28'),'edad promedio');assert.equal(category('1966-10-28','2026-10-28'),'tercera edad');});
test('Las contraseñas se verifican y cada hash tiene una sal distinta',()=>{const a=hash('Password-test-123');assert.ok(verify('Password-test-123',a));assert.equal(verify('incorrecta',a),false);assert.notEqual(a,hash('Password-test-123'));});
