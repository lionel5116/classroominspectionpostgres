const { getPool } = require('../db/config');
const { TEMP_MIN_F, TEMP_MAX_F, CLEANLINESS_ALERT_THRESHOLD, rangeToDays } = require('../helpers/thresholds');
const { withRetry } = require('../helpers/withRetry');

async function getSummary(req, res, next) {
  try {
    const { range, schoolNumber } = req.query;
    const days = rangeToDays(range);
    const schoolFilter = schoolNumber && schoolNumber !== 'all';

    const { stats, tempByDayResult, bySchoolResult } = await withRetry(async () => {
      const pool = getPool();

      // Stat cards — scoped to the selected time range + school filter.
      const statsParams = [days];
      if (schoolFilter) statsParams.push(schoolNumber);
      const statsResult = await pool.query(`
        SELECT
          COUNT(*) AS "InspectionsCount",
          SUM(CASE WHEN temperature_reading < ${TEMP_MIN_F} OR temperature_reading > ${TEMP_MAX_F} THEN 1 ELSE 0 END) AS "TempAlerts",
          SUM(CASE WHEN cleanliness_rating <= ${CLEANLINESS_ALERT_THRESHOLD} THEN 1 ELSE 0 END) AS "CleanlinessAlerts",
          AVG(cleanliness_rating::decimal(4,2)) AS "AvgCleanliness"
        FROM inspections
        WHERE inspected_at::date >= CURRENT_DATE - $1::int
        ${schoolFilter ? 'AND school_number = $2' : ''}
      `, statsParams);
      const stats = statsResult.rows[0];

      // Average temperature by day — always the trailing 7 days, regardless of the range toggle.
      const tempByDayParams = [];
      if (schoolFilter) tempByDayParams.push(schoolNumber);
      const tempByDayResult = await pool.query(`
        SELECT inspected_at::date AS "Day", AVG(temperature_reading::decimal(5,2)) AS "AvgTemp"
        FROM inspections
        WHERE inspected_at::date >= CURRENT_DATE - 6
        ${schoolFilter ? 'AND school_number = $1' : ''}
        GROUP BY inspected_at::date
        ORDER BY "Day"
      `, tempByDayParams);

      // Avg cleanliness by school — scoped to the selected time range, always broken out by every school.
      const bySchoolResult = await pool.query(`
        SELECT s.school_number AS "SchoolNumber", s.school_name AS "SchoolName", AVG(i.cleanliness_rating::decimal(4,2)) AS "AvgCleanliness"
        FROM inspections i
        JOIN schools s ON s.school_number = i.school_number
        WHERE i.inspected_at::date >= CURRENT_DATE - $1::int
        GROUP BY s.school_number, s.school_name
        ORDER BY s.school_number
      `, [days]);

      return { stats, tempByDayResult, bySchoolResult };
    });

    res.json({
      inspectionsCount: stats.InspectionsCount || 0,
      tempAlerts: stats.TempAlerts || 0,
      cleanlinessAlerts: stats.CleanlinessAlerts || 0,
      avgCleanliness: stats.AvgCleanliness !== null ? Number(stats.AvgCleanliness) : null,
      tempByDay: tempByDayResult.rows.map((row) => ({
        day: row.Day,
        avgTemp: Number(row.AvgTemp),
        isAlert: row.AvgTemp < TEMP_MIN_F || row.AvgTemp > TEMP_MAX_F,
      })),
      cleanlinessBySchool: bySchoolResult.rows.map((row) => ({
        schoolNumber: row.SchoolNumber,
        schoolName: row.SchoolName,
        avgCleanliness: Number(row.AvgCleanliness),
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
