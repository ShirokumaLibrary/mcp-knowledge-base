import winston from 'winston';
import path from 'path';
import { getConfig } from '../config.js';
const { combine, timestamp, printf, colorize, errors } = winston.format;
const config = getConfig();
let globalHandlersInstalled = false;
const customFormat = printf(({ level, message, timestamp, service, ...metadata }) => {
    let msg = `${timestamp} [${service}] ${level}: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});
const devFormat = combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), customFormat);
const prodFormat = combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), winston.format.json());
const logLevel = process.env.LOG_LEVEL || (config.logging.enabled ? config.logging.level : 'error');
let consoleTransport = null;
function getConsoleTransport() {
    if (!consoleTransport) {
        consoleTransport = new winston.transports.Console({
            format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat
        });
        if (typeof consoleTransport.setMaxListeners === 'function') {
            consoleTransport.setMaxListeners(100);
        }
    }
    return consoleTransport;
}
function addFileTransports(transports) {
    if (process.env.NODE_ENV === 'production' && config.logging.enabled) {
        transports.push(new winston.transports.File({
            filename: path.join(config.logging.logDir, 'error.log'),
            level: 'error',
            format: prodFormat
        }), new winston.transports.File({
            filename: path.join(config.logging.logDir, 'combined.log'),
            format: prodFormat
        }));
    }
}
export function createLogger(service) {
    if (process.env.MCP_MODE === 'production' || process.env.DISABLE_LOGGING === 'true') {
        return winston.createLogger({
            silent: true,
            transports: []
        });
    }
    const loggerTransports = [];
    if (process.env.NODE_ENV !== 'test' && process.env.MCP_MODE !== 'production') {
        loggerTransports.push(getConsoleTransport());
    }
    const loggerOptions = {
        level: logLevel,
        silent: logLevel === 'silent' || process.env.NODE_ENV === 'test' || process.env.MCP_MODE === 'production',
        defaultMeta: { service },
        transports: loggerTransports
    };
    if (!globalHandlersInstalled && process.env.NODE_ENV !== 'test') {
        globalHandlersInstalled = true;
        loggerOptions.exceptionHandlers = [
            new winston.transports.Console({
                format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), printf(info => `${info.timestamp} [UNCAUGHT EXCEPTION] ${info.message}`))
            })
        ];
        loggerOptions.rejectionHandlers = [
            new winston.transports.Console({
                format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), printf(info => `${info.timestamp} [UNHANDLED REJECTION] ${info.message}`))
            })
        ];
    }
    addFileTransports(loggerTransports);
    return winston.createLogger(loggerOptions);
}
export const logger = createLogger('mcp-knowledge-base');
