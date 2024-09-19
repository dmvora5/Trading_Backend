const { logger } = require("../utils/logger");

function configureSocket(io) {
    global.io = io;
    io.on("connection", (socket) => {
        console.log("Connection established with socketId: ", socket?.id)
    })
}


async function getSelectedStock({eventName, data}) {
    try {
        global.io.emit(eventName, data)
    } catch (err) {
        logger.error("[Error in getSelectedStock]" + err.message);
        console.log('err', err)
    }
}

module.exports = { configureSocket, getSelectedStock };