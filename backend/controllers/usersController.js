const { getPool } = require('../db/config');
const { withRetry } = require('../helpers/withRetry');

const BASE_SELECT = `
  SELECT u.user_id AS "UserID", u.school_number AS "SchoolNumber", s.school_name AS "SchoolName",
         u.network_id AS "NetworkID", u.full_name AS "FullName",
         u.is_power_user AS "IsPowerUser", u.is_notification_recipient AS "IsNotificationRecipient",
         u.created_at AS "CreatedAt", u.updated_at AS "UpdatedAt"
  FROM users u
  JOIN schools s ON s.school_number = u.school_number
`;

async function listUsers(req, res, next) {
  try {
    const { filter, search } = req.query;

    const result = await withRetry(() => {
      const clauses = [];
      const params = [];

      if (filter === 'power') clauses.push('u.is_power_user = true');
      else if (filter === 'notifications') clauses.push('u.is_notification_recipient = true');
      else if (filter === 'district') clauses.push("u.school_number = '000'");

      if (search) {
        params.push(`%${search}%`);
        clauses.push(`(u.full_name ILIKE $${params.length} OR u.network_id ILIKE $${params.length} OR s.school_name ILIKE $${params.length})`);
      }

      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      return getPool().query(`${BASE_SELECT} ${where} ORDER BY s.school_number, u.full_name`, params);
    });

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { schoolNumber, networkId, fullName, isPowerUser, isNotificationRecipient } = req.body;

    if (!schoolNumber || !networkId || !fullName) {
      return res.status(400).json({ error: 'schoolNumber, networkId, and fullName are required' });
    }

    const pool = getPool();
    const inserted = await pool.query(
      `INSERT INTO users (school_number, network_id, full_name, is_power_user, is_notification_recipient)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id`,
      [schoolNumber, networkId, fullName, !!isPowerUser, !!isNotificationRecipient]
    );

    const newUserId = inserted.rows[0].user_id;
    const created = await pool.query(`${BASE_SELECT} WHERE u.user_id = $1`, [newUserId]);

    res.status(201).json(created.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Network ID already exists' });
    }
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { schoolNumber, networkId, fullName, isPowerUser, isNotificationRecipient } = req.body;

    const pool = getPool();
    const result = await pool.query(
      `UPDATE users
       SET school_number = $1,
           network_id = $2,
           full_name = $3,
           is_power_user = $4,
           is_notification_recipient = $5,
           updated_at = now()
       WHERE user_id = $6`,
      [schoolNumber, networkId, fullName, !!isPowerUser, !!isNotificationRecipient, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await pool.query(`${BASE_SELECT} WHERE u.user_id = $1`, [id]);

    res.json(updated.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Network ID already exists' });
    }
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const pool = getPool();
    const result = await pool.query('DELETE FROM users WHERE user_id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
