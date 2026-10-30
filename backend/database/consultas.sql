USE carreras_db;
-- Ejecuta de nuevo esta consulta después de registrar un participante.
SELECT id, name, email, role, birth_date, created_at FROM users ORDER BY id DESC;
-- Inscripciones con folio y datos asociados.
SELECT g.folio, u.name AS participante, u.email, r.title AS carrera,
       r.date AS fecha_carrera, d.km, g.category AS categoria, g.created_at
FROM registrations g
JOIN users u ON u.id = g.user_id
JOIN races r ON r.id = g.race_id
JOIN distances d ON d.id = g.distance_id AND d.race_id = g.race_id
ORDER BY g.id DESC;
