const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('escuela.db');



db.exec(`
  CREATE TABLE IF NOT EXISTS alumnos (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    seccion TEXT NOT NULL,
    edad INTEGER
  )
`);

const alumnos = [
  { nombre: 'Ana', seccion: '1114', edad: 19 },
  { nombre: 'Luis', seccion: '1114', edad: 21 },
  { nombre: 'Marta', seccion: '1113', edad: 20 },
  { nombre: 'Pedro', seccion: '1114', edad: 18 },
];

const insert = db.prepare('INSERT INTO alumnos (nombre, seccion, edad) VALUES (?, ?, ?)');
for (const a of alumnos) {
  insert.run(a.nombre, a.seccion, a.edad);
}

console.log('Datos cargados en escuela.db');




const selSeccion = db.prepare('SELECT * FROM alumnos WHERE seccion = ?');
console.log('Alumnos de 1114:', selSeccion.all('1114'));

const selMayores = db.prepare('SELECT nombre, edad FROM alumnos WHERE edad >= ? ORDER BY edad');
console.log('Mayores de 20:', selMayores.all(20));

const selPrimero = db.prepare('SELECT * FROM alumnos ORDER BY edad DESC LIMIT 1');
console.log('El mas grande:', selPrimero.get());

const selCuenta = db.prepare('SELECT COUNT(*) AS total FROM alumnos');
console.log('Total de alumnos:', selCuenta.get());



const actualizar = db.prepare('UPDATE alumnos SET edad = ? WHERE nombre = ?');
const cambio = actualizar.run(22, 'Ana');
console.log('Filas actualizadas:', cambio.changes);

const borrar = db.prepare('DELETE FROM alumnos WHERE nombre = ?');
const borrado = borrar.run('Marta');
console.log('Filas borradas:', borrado.changes);



const rows = selSeccion.all('1114');
const json = JSON.stringify(rows, null, 2);
console.log('Como JSON:');
console.log(json);




db.exec(`
  CREATE TABLE IF NOT EXISTS cursos (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS inscripciones (
    alumno_id INTEGER,
    curso_id INTEGER,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
  )
`);

const cursos = ['Base de Datos', 'JavaScript', 'Programacion'];

const insertarCurso = db.prepare(`
  INSERT OR IGNORE INTO cursos (nombre)
  VALUES (?)
`);

for (const curso of cursos) {
  insertarCurso.run(curso);
}


// Inscripciones
const inscribir = db.prepare(`
  INSERT OR IGNORE INTO inscripciones (alumno_id, curso_id)
  VALUES (
    (SELECT id FROM alumnos WHERE nombre = ?),
    (SELECT id FROM cursos WHERE nombre = ?)
  )
`);

const inscripciones = [
  ['Ana', 'Base de Datos'],
  ['Ana', 'JavaScript'],
  ['Luis', 'Base de Datos'],
  ['Luis', 'Programacion'],
  ['Pedro', 'JavaScript']
];

for (const [alumno, curso] of inscripciones) {
  inscribir.run(alumno, curso);
}


// Alumnos de Base de Datos
const alumnosBaseDatos = db.prepare(`
  SELECT alumnos.nombre
  FROM alumnos
  JOIN inscripciones ON alumnos.id = inscripciones.alumno_id
  JOIN cursos ON cursos.id = inscripciones.curso_id
  WHERE cursos.nombre = ?
`);

console.log('Alumnos de Base de Datos:');
console.log(alumnosBaseDatos.all('Base de Datos'));


// Cantidad de cursos por alumno
const cursosPorAlumno = db.prepare(`
  SELECT alumnos.nombre,
         COUNT(inscripciones.curso_id) AS cantidad_cursos
  FROM alumnos
  LEFT JOIN inscripciones
    ON alumnos.id = inscripciones.alumno_id
  GROUP BY alumnos.id, alumnos.nombre
  ORDER BY alumnos.nombre
`);

console.log('Cursos por alumno:');
console.log(cursosPorAlumno.all());


// Todas las inscripciones
const todasLasInscripciones = db.prepare(`
  SELECT alumnos.nombre AS alumno,
         cursos.nombre AS curso
  FROM inscripciones
  JOIN alumnos ON alumnos.id = inscripciones.alumno_id
  JOIN cursos ON cursos.id = inscripciones.curso_id
  ORDER BY alumnos.nombre, cursos.nombre
`);

console.log('Todas las inscripciones:');
console.log(todasLasInscripciones.all());

db.close();

