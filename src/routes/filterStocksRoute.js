const express = require('express');
const {  getIndicesAction } = require('../controller/StockFilterController');

const router = express.Router();

router.get('/indices', getIndicesAction);

module.exports = router;