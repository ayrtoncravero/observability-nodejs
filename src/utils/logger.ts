import {
    createLogger,
    transports,
    format,
} from 'winston';

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.json(),
        format.timestamp(),
        format.printf(info => `[${info.timestamp}] ${info.level} ${info.message}`),
    ),
    transports: [
        new transports.File({
            maxsize: 5120000,
            maxFiles: 5,
            filename: 'logs/log-api.log',
        }),
        new transports.Console({
            level: 'debug',
        }),
    ],
});   

export default logger;
