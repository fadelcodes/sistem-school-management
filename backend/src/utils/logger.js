const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logger = {
    info: (message, data = {}) => {
        const log = `[${new Date().toISOString()}] INFO: ${message} ${JSON.stringify(data)}\n`;
        fs.appendFileSync(path.join(logDir, 'app.log'), log);
        console.log(log);
    },
    error: (message, error = {}) => {
        const log = `[${new Date().toISOString()}] ERROR: ${message} ${JSON.stringify(error)}\n`;
        fs.appendFileSync(path.join(logDir, 'error.log'), log);
        console.error(log);
    },
    audit: (userId, action, details = {}) => {
        const log = `[${new Date().toISOString()}] AUDIT: User=${userId} Action=${action} ${JSON.stringify(details)}\n`;
        fs.appendFileSync(path.join(logDir, 'audit.log'), log);
    }
};

module.exports = { logger };