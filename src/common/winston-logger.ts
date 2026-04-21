import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

// 로그 레벨 정의
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 로그 색상 정의
export const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// 로그 포맷 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.colorize({ all: true }),
);

// 콘솔 전송 포맷
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, context, stack }) => {
    let log = `[${timestamp}] ${level}:`;
    if (context) log += ` [${context}]`;
    log += ` ${message}`;
    if (stack) log += `\n${stack}`;
    return log;
  }),
);

// 파일 전송 포맷
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Daily Rotate File 설정
const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join('logs', 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

// 에러 로그용 Daily Rotate File
const errorDailyRotateFileTransport = new DailyRotateFile({
  filename: path.join('logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
});

// winston 설정 적용
winston.addColors(LOG_COLORS);

// Logger 생성
export const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: LOG_LEVELS,
  format: logFormat,
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // 파일 출력
    dailyRotateFileTransport,
    errorDailyRotateFileTransport,
  ],
  // 예외 처리
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  // 프로세스 종료 시 처리되지 않은 예외
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'rejections.log'),
      format: fileFormat,
    }),
  ],
});

// NestJS Logger 인터페이스와 호환되는 래퍼
export class WinstonLogger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  error(message: any, context?: string, ...args: any[]) {
    const ctx = context || this.context;
    winstonLogger.error(message, { context: ctx, ...args });
  }

  warn(message: any, context?: string, ...args: any[]) {
    const ctx = context || this.context;
    winstonLogger.warn(message, { context: ctx, ...args });
  }

  log(message: any, context?: string, ...args: any[]) {
    const ctx = context || this.context;
    winstonLogger.info(message, { context: ctx, ...args });
  }

  info(message: any, context?: string, ...args: any[]) {
    const ctx = context || this.context;
    winstonLogger.info(message, { context: ctx, ...args });
  }

  debug(message: any, context?: string, ...args: any[]) {
    const ctx = context || this.context;
    winstonLogger.debug(message, { context: ctx, ...args });
  }

  verbose(message: any, context?: string, ...args: any[]) {
    const ctx = context || this.context;
    winstonLogger.verbose(message, { context: ctx, ...args });
  }
}

// 기본 logger 인스턴스
export const logger = new WinstonLogger();
