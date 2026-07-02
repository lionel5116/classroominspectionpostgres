const { getPool } = require('../db/config');
const { rangeToDays } = require('../helpers/thresholds');
const { withRetry } = require('../helpers/withRetry');

const BASE_SELECT = `
  SELECT i.inspection_id AS "InspectionID", i.school_number AS "SchoolNumber", s.school_name AS "SchoolName",
         i.classroom_number AS "ClassroomNumber", i.temperature_reading AS "TemperatureReading",
         i.issue_description AS "IssueDescription", i.cleanliness_rating AS "CleanlinessRating",
         i.cleaning_notes AS "CleaningNotes", i.inspected_by AS "InspectedBy", i.inspected_at AS "InspectedAt"
  FROM inspections i
  JOIN schools s ON s.school_number = i.school_number
`;

async function listInspections(req, res, next) {
  try {
    const { schoolNumber, range } = req.query;

    const result = await withRetry(() => {
      const clauses = [];
      const params = [];

      if (range) {
        params.push(rangeToDays(range));
        clauses.push(`i.inspected_at::date >= CURRENT_DATE - $${params.length}::int`);
      }
      if (schoolNumber && schoolNumber !== 'all') {
        params.push(schoolNumber);
        clauses.push(`i.school_number = $${params.length}`);
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

      return getPool().query(`${BASE_SELECT} ${where} ORDER BY i.inspected_at DESC`, params);
    });

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function createInspection(req, res, next) {
  try {
    const {
      schoolNumber,
      classroomNumber,
      temperatureReading,
      issueDescription,
      cleanlinessRating,
      cleaningNotes,
      inspectedBy,
    } = req.body;

    if (!schoolNumber || !classroomNumber || temperatureReading === undefined || !cleanlinessRating) {
      return res.status(400).json({
        error: 'schoolNumber, classroomNumber, temperatureReading, and cleanlinessRating are required',
      });
    }

    const pool = getPool();
    const inserted = await pool.query(
      `INSERT INTO inspections
        (school_number, classroom_number, temperature_reading, issue_description, cleanliness_rating, cleaning_notes, inspected_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING inspection_id`,
      [
        schoolNumber,
        classroomNumber,
        temperatureReading,
        issueDescription || null,
        cleanlinessRating,
        cleaningNotes || null,
        inspectedBy || null,
      ]
    );

    const newId = inserted.rows[0].inspection_id;
    const created = await pool.query(`${BASE_SELECT} WHERE i.inspection_id = $1`, [newId]);

    res.status(201).json(created.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listInspections, createInspection };
