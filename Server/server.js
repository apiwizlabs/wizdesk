const express = require("express");
require('dotenv').config();
const cors = require("cors");
const authRoutes = require("./Routes/Auth")
const orgRoutes = require("./Routes/Organisation")
const emailRoutes = require("./Routes/Email")
const ticketRoutes = require("./Routes/Tickets");
const viewRoutes = require("./Routes/Views");
const fileRoutes = require("./Routes/File");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const actuator = require('express-actuator');
const app = express();
const config = require("./config");
const logger = require("./utils/logger");
const dbConnect = require("./db/db.connect")



dbConnect();
global.logger = logger;

const options = {
    basePath: '/management', // It will set /management/info instead of /info
    infoGitMode: null, // the amount of git information you want to expose, 'simple' or 'full',
    infoBuildOptions: null, // extra information you want to expose in the build object. Requires an object.
    infoDateFormat: null, // by default, git.commit.time will show as is defined in git.properties. If infoDateFormat is defined, moment will format git.commit.time. See https://momentjs.com/docs/#/displaying/format/.
    customEndpoints: []
}

app.use(cors());
app.use(actuator(options));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));


app.use("/auth", authRoutes);
app.use("/organisation", orgRoutes);
app.use("/email", emailRoutes)
app.use("/tickets", ticketRoutes)
app.use("/views", viewRoutes)
app.use("/file", fileRoutes)


const PORT = config.PORT || 3002;

// logger.info(os.cpuUsage(function (v){
//     logger.info('CPU Usage -'+v)
// })); 
// // logger.info(os.totalmem());
// // logger.info(os.freemem())


app.listen(PORT, logger.info(`Server started on PORT ${PORT}`));