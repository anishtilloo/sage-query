import dayjs from "dayjs";

import { config } from "../config";
import fs from 'fs/promises';
import { EOL } from 'os';

enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    FATAL = "FATAL"
}

class Logger {
    private colors = {
        [LogLevel.DEBUG]: "\x1b[36m", // Cyan
        [LogLevel.INFO]: "\x1b[32m",  // Green
        [LogLevel.WARN]: "\x1b[33m",  // Yellow
        [LogLevel.ERROR]: "\x1b[31m", // Red
        [LogLevel.FATAL]: "\x1b[35m"  // Magenta
    };

    private resetColor = "\x1b[0m"; // Reset
    private timestampColor = "\x1b[90m"; // Gray

    private shouldLog(level: LogLevel) {
        const priority = {
            [LogLevel.DEBUG]: 1,
            [LogLevel.INFO]: 2,
            [LogLevel.WARN]: 3,
            [LogLevel.ERROR]: 4,
            [LogLevel.FATAL]: 5
        };

        if (!config.logger.enableLogs && priority[level] < 4) {
            return false;
        }
        return true;
    }

    private log(level: LogLevel, message: string, ...optionalParams: any[]) {
        if (this.shouldLog(level)) {
            const timestamp = dayjs().format(config.logger.dateTimeFormat);;
            const color = this.colors[level];
            if (config.logger.storeLogs) {
                fs.appendFile('app.log', JSON.stringify(`[${timestamp}] [${level}] ${message} ${optionalParams}`).trim());
                fs.appendFile('app.log', EOL);
            }
            console.log(`${this.timestampColor}[${timestamp}] ${color}[${level}]${this.resetColor}`, message, ...optionalParams);
        }
    }

    debug(message: string, ...optionalParams: any[]) {
        this.log(LogLevel.DEBUG, message, ...optionalParams);
    }

    info(message: string, ...optionalParams: any[]) {
        this.log(LogLevel.INFO, message, ...optionalParams);
    }

    warn(message: string, ...optionalParams: any[]) {
        this.log(LogLevel.WARN, message, ...optionalParams);
    }

    error(message: string, ...optionalParams: any[]) {
        this.log(LogLevel.ERROR, message, ...optionalParams);
    }

    fatal(message: string, ...optionalParams: any[]) {
        this.log(LogLevel.FATAL, message, ...optionalParams);
    }
}

export const logger = new Logger();