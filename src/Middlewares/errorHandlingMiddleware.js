const { logger } = require("../utils/logger");

exports.errorHandler = (err, req, res, next) => {
    logger.error( err.message + " " + err?.status || 500)
	console.log("err", err);
	res.status(err?.status || 500).json({
		success: false,
		message: err.message,
		status: err.status,
		err: err,
	});
};
