require('dotenv').config();

const express = require('express');

const cors = require("cors");
const { errorHandler } = require('./src/Middlewares/errorHandlingMiddleware');
const db = require('./src/config/DatabaseConnect');

//socket
const http = require("http");
const { Server } = require("socket.io");

//routes
const filterRoute = require('./src/routes/filterStocksRoute');
const adminRoutes = require("./src/routes/adminRoutes");
const sdStatergyRoutes = require("./src/routes/sd-statergy-routes")


const { configureSocket } = require('./src/config/socket');



const whiteList = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
];


const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: whiteList } });


const corsOptions = {
    origin: (origin, callback) => {
        if (whiteList.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // callback(new Error('Not allowed by CORS'));
            callback(null, true);
        }
    },
    credentials: true, // enable set cookie
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

configureSocket(io);

app.use('/api/v1/sd', sdStatergyRoutes)
app.use('/api/v1/filter', filterRoute);
app.use("/api/v1/admin", adminRoutes);

app.use(errorHandler);

db.once('open', async () => {
    server.listen(process.env.PORT, () => {
        console.log(`server is running on port ${process.env.PORT}`);
    });
});

db.on('error', console.error.bind(console, 'MongoDB connection error:'));