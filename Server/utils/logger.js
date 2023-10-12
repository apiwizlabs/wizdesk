const winston = require("winston");
require("winston-daily-rotate-file");
const config = require("../config");
const path = require("path");
const PROJECT_ROOT = path.join(__dirname, "..");

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}


const format = winston.format.combine(
  winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
  winston.format.json(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
)

const transports = [
  new winston.transports.Console(),
  new winston.transports.DailyRotateFile({
    filename: "logs/errors/error-%DATE%.log",
    datePattern: "DD-MM-YYYY",
    level: "error",
    format: winston.format.combine(
      winston.format.timestamp({ format : 'DD-MM-YYYY HH:mm:ss' }),
      winston.format.json(),
      winston.format.printf(
        (error) => `${error.timestamp} ${error.level}: ${JSON.stringify(error.message)}`,
      ),
    )
  }),

  new winston.transports.DailyRotateFile({
    filename: "logs/warn/warn-%DATE%.log",
    datePattern: "DD-MM-YYYY",
    level: "warn",
    format: winston.format.combine(
      winston.format.timestamp({ format : 'DD-MM-YYYY HH:mm:ss' }),
      winston.format.json(),
      winston.format.printf(
        (warning) => `${warning.timestamp} ${warning.level}: ${JSON.stringify(warning.message)}`,
      ),
    )
  }),

  new winston.transports.DailyRotateFile({
    filename: "logs/info/info-%DATE%.log",
    datePattern: "DD-MM-YYYY",
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({ format : 'DD-MM-YYYY HH:mm:ss' }),
      winston.format.json(),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${JSON.stringify(info.message)}`,
      ),
    )
  }),

  new winston.transports.DailyRotateFile({
    filename: "logs/debug/debug-%DATE%.log",
    datePattern: "DD-MM-YYYY",
    level: "debug",
    format: winston.format.combine(
      winston.format.timestamp({ format : 'DD-MM-YYYY HH:mm:ss' }),
      winston.format.json(),
      winston.format.printf(
        (debug) => `${debug.timestamp} ${debug.level}: ${JSON.stringify(debug.message)}`,
      ),
    )
  }),
 

];

const logger = winston.createLogger({
  levels,
  format,
  transports,
})


module.exports.debug = function () {
  logger.debug.apply(logger, formatLogArguments(arguments));
};

module.exports.info = function () {
  logger.info.apply(logger, formatLogArguments(arguments));
};

module.exports.warn = function () {
  logger.warn.apply(logger, formatLogArguments(arguments));
};

module.exports.error = function () {
  logger.error.apply(logger, formatLogArguments(arguments));
};

module.exports.http = function() {
  logger.http.apply(logger, formatLogArguments(arguments));
}


function formatLogArguments(args) {
  args = Array.prototype.slice.call(args);

  const stackInfo = getStackInfo(1);

  if (stackInfo) {
    const calleeStr = `( ${stackInfo.relativePath} : ${stackInfo.line} )`;
    const calleeStrHl = calleeStr;
    if(args.length === 2){
      args[0] = `${calleeStrHl} log --> ${args[0]} ${args[1]}`
    }
    else if (typeof args[0] === 'string') {
      args[0] = `${calleeStrHl} log --> ${args[0]}`;
    } else {
      logger.debug(args)
      args.unshift(calleeStr);
    }
  }

  return args;
}

function getStackInfo(stackIndex) {
  const stacklist = new Error().stack.split('\n').slice(3);
  const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
  const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

  const s = stacklist[stackIndex] || stacklist[0];
  const sp = stackReg.exec(s) || stackReg2.exec(s);

  if (sp && sp.length === 5) {
    return {
      method: sp[1],
      relativePath: path.relative(PROJECT_ROOT, sp[2]),
      line: sp[3],
      pos: sp[4],
      file: path.basename(sp[2]),
      stack: stacklist.join('\n'),
    };
  }
}
