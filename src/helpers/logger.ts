import { createLogger, format, transports } from 'winston';
import packageJson from '../../package.json';
import { isDev, isTest } from './helpers';

// process.env.NODE_ENV === 'test'

const colorizer = format.colorize();

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: packageJson.name },
    transports: [
        new transports.File({ filename: 'error.log', level: 'error', silent: isTest() }),
        new transports.File({ filename: 'combined.log', silent: isTest() }),
    ],
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
/* istanbul ignore next */
if (isDev()) {
    logger.add(
        new transports.Console({
            level: process.env.LOG_LEVEL || 'info',
            format: format.combine(
                format.printf(info => {
                    let { timestamp, level, message } = info;
                    const prefix = colorizer.colorize(level, `${packageJson.name}:${level}`);
                    return `${prefix} ${timestamp.split('.')[0]}: ${message}`;
                })
            ),
        })
    );
}

export default logger;
