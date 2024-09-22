const express = require('express');
const {
    addSdStatergyAction,
    getSdStatergysAction,
    runSdStatergyAction,
    stopSdStatergyAction,
    deleteSdStatergyAction,
    updateSdStatergyAction,
    startRunningStatergy,
    getSdFilteredData,
    runSdFilterAction
} = require('../controller/sDStatergiesController');

const router = express.Router();

router.use(express.json());

router.get('/', getSdStatergysAction);
router.post('/', addSdStatergyAction);
router.post("/run", runSdStatergyAction);
router.post("/stop", stopSdStatergyAction);
router.delete("/:id", deleteSdStatergyAction);
router.patch("/", updateSdStatergyAction);

router.post('/re-run', startRunningStatergy);

router.get("/filter/:sid", getSdFilteredData)

router.get("/run-filter", runSdFilterAction)


module.exports = router;