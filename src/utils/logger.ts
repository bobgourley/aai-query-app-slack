import fs from 'fs';
import path from 'path';

const logFile = path.join(__dirname, '../../logs/vectara.log');

// Ensure logs directory exists
const logsDir = path.dirname(logFile);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

export function logToFile(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n${data ? JSON.stringify(data, null, 2) + '\n' : ''}`;
    fs.appendFileSync(logFile, logEntry);
}
