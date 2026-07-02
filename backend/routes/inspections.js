const express = require('express');
const router = express.Router();
const { listInspections, createInspection } = require('../controllers/inspectionsController');

router.get('/', listInspections);
router.post('/', createInspection);

module.exports = router;
