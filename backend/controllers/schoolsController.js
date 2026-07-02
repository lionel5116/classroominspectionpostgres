const { getPool } = require('../db/config');
const { withRetry } = require('../helpers/withRetry');

async function listSchools(req, res, next) {
  try {
    const result = await withRetry(() =>
      getPool().query(
        'SELECT school_number AS "SchoolNumber", school_name AS "SchoolName" FROM schools ORDER BY school_number'
      )
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listSchools };
