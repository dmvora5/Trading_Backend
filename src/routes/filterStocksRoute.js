const express = require('express');
const { strucralSDFilter } = require('../controller/StockFilterController');

const router = express.Router();

router.get('/sd-filter', strucralSDFilter);

module.exports = router;