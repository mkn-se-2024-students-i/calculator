const { hasArg } = require('./args_parser')

// todo: log to file, logging from docker

if (hasArg('log')) {
    module.exports = {
        logReq: (req) => {
            console.log(`${new Date().toUTCString().padEnd(36)} FROM ${req.ip.toString().padEnd(20)} ${req.method} ${req.path}`)
        },
        logFileDownload: (url) => {
            console.log(`${new Date().toUTCString().padEnd(36)} Download ${url}`)
        }
    }
} else {
    module.exports = {
        logReq: () => {},
        logFileDownload: () => {}
    }
}
