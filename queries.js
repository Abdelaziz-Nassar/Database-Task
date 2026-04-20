/**
 * Database lab — queries.js
 * ---------------------
 * Standalone script: connect to the same DB, run example aggregate SELECTs.
 * Run after you have submitted at least one CV via the web form:
 *   node queries.js
 *   npm run queries
 */

const { connectDb, getPool } = require('./db');

async function runQueries() {
  await connectDb();
  const pool = getPool();

  // —— QUERY 1: COUNT — how many courses per person (LEFT JOIN keeps people with 0 courses)
  console.log('\n── QUERY 1: Number of courses per person ──');

  const [courseCounts] = await pool.query(`
    SELECT p.fName, p.lName, COUNT(c.idcourse) AS courseCount
    FROM person p
    LEFT JOIN course c ON c.person_idperson = p.idperson
    GROUP BY p.idperson
    ORDER BY courseCount DESC
  `);

  courseCounts.forEach(row =>
    console.log(`  ${row.fName} ${row.lName} → ${row.courseCount} course(s)`)
  );

  // —— QUERY 2: only persons with more than 1 project
  console.log('\n── QUERY 2: Persons with more than 1 project ──');

  const [topPerson] = await pool.query(`
    SELECT p.fName, p.lName, COUNT(pr.idproject) AS projectCount
    FROM person p
    INNER JOIN project pr ON pr.person_idperson = p.idperson
    GROUP BY p.idperson
    HAVING projectCount > 1
    ORDER BY projectCount DESC
  `);

  if (topPerson.length > 0) {
    topPerson.forEach(t =>
      console.log(`  ${t.fName} ${t.lName} — ${t.projectCount} project(s)`)
    );
  } else {
    console.log('  No data yet.');
  }

  // —— QUERY 3: DISTINCT — list unique countries in person table
  console.log('\n── QUERY 3: Unique countries ──');

  const [distinctCountries] = await pool.query(`
    SELECT DISTINCT country
    FROM person
    ORDER BY country ASC
  `);

  distinctCountries.forEach(row =>
    console.log(`  ${row.country || 'N/A'}`)
  );

  // —— QUERY 4: DELETE — remove persons with no city set
  // console.log('\n── QUERY 4: Delete persons with no city ──');

  // const [deleteResult] = await pool.query(`
  //   DELETE FROM person
  //   WHERE city IS NULL OR city = ''
  // `);

  // console.log(`  Deleted ${deleteResult.affectedRows} person(s) with no city.`);

// —— QUERY 5: UPDATE — update email for person with id = 1
console.log('\n── QUERY 5: Update email for person with id = 1 ──');

const [updateResult] = await pool.query(`
  UPDATE person p SET p.email = 'test@updated.com' where p.idperson = 1 ;
`);
console.log(`  Updated ${updateResult.affectedRows} person(s) email(s).`);


// ======================================== TASK =============================================================
// 1- Show persons who are enrolled in more than 2 courses, display their full name and course count
console.log('\n── TASK1: Persons with more than 2 courses ──');
const [personsWithCourses] = await pool.query(`
  SELECT p.fName, p.lName, COUNT(c.idcourse) AS courseCount
  FROM person p
  INNER JOIN course c ON c.person_idperson = p.idperson
  GROUP BY p.idperson
  HAVING courseCount > 2
  ORDER BY courseCount DESC
`);

if (personsWithCourses.length > 0) {
  personsWithCourses.forEach(p =>
    console.log(`  ${p.fName} ${p.lName} — ${p.courseCount} course(s)`)
  );
} else {
  console.log('  No data found.');
}
// 2- list each distinct country and the number of persons in it, only show countries with more than 2 persons
console.log('\n── TASK 2: Countries with more than 2 persons ──');

const [countriesCount] = await pool.query(`
  SELECT country, COUNT(idperson) AS personCount
  FROM person
  GROUP BY country
  HAVING personCount > 2
  ORDER BY personCount DESC
`);

if (countriesCount.length > 0) {
  countriesCount.forEach(c =>
    console.log(`  ${c.country || 'N/A'} — ${c.personCount} person(s)`)
  );
} else {
  console.log('  No data found.');
}
// 3- Update the email of all persons who have at least one project, set it to their firstName + lastName + '@company.com
console.log('\n── TASK 3: Update email for persons with projects ──');

const [updateEmails] = await pool.query(`
  UPDATE person p
  SET p.email = CONCAT(p.fName, p.lName, '@company.com')
  WHERE EXISTS (
    SELECT 1
    FROM project pr
    WHERE pr.person_idperson = p.idperson
  )
`);

console.log(`  Updated ${updateEmails.affectedRows} person(s) email(s).`);
// 4- Delete all courses that belong to persons from a specific country
console.log('\n── TASK 4: Delete courses by country ──');

const country = 'USA'; 

const [deleteCourses] = await pool.query(`
  DELETE c
  FROM course c
  INNER JOIN person p ON p.idperson = c.person_idperson
  WHERE p.country = ?
`, [country]);

console.log(`  Deleted ${deleteCourses.affectedRows} course(s) for country: ${country}`);

// 5- Show each country and the average number of languages spoken by persons from that country, only show countries where the average is more than 1
console.log('\n── TASK 5: Avg languages per country (>1) ──');

const [avgLanguages] = await pool.query(`
  SELECT country, ROUND(AVG(langCount), 2) AS avgLanguages
  FROM (
    SELECT p.idperson, p.country, COUNT(l.idlanguage) AS langCount
    FROM person p
    LEFT JOIN language l ON l.person_idperson = p.idperson
    GROUP BY p.idperson
  ) AS personLangs
  GROUP BY country
  HAVING avgLanguages > 1
  ORDER BY avgLanguages DESC
`);

if (avgLanguages.length > 0) {
  avgLanguages.forEach(c =>
    console.log(`  ${c.country || 'N/A'} — ${c.avgLanguages} language(s)`)
  );
} else {
  console.log('  No data found.');
}

  await pool.end();
}

runQueries().catch(err => console.error('Error:', err.message));