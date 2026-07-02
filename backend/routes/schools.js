const express = require('express');
const router = express.Router();
const { listSchools } = require('../controllers/schoolsController');

router.get('/', listSchools);

module.exports = router;
