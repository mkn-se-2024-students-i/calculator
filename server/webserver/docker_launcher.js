const fs = require('fs')
const child_process = require('child_process')

const { hasArg, argParams } = require('./args_parser')
const secrets = require('./secrets')

if (hasArg('build')) {
    fs.rmSync('Dockerfile', { force: true })
    fs.writeFileSync('Dockerfile', `
FROM node:22-alpine
WORKDIR .
COPY ./package.json ./package-lock.json ./main.js ./config.js ./args_parser.js ./
RUN npm i
CMD node main.js docker ${secrets.ip} ${secrets.port} ${secrets.publishReleaseString} ${hasArg('hot') ? 'hot' : 'cold'}
EXPOSE ${secrets.port}
`)
    child_process.execSync(`sudo docker build -t webserver .`, { stdio: 'inherit' })
} else if (hasArg('run')) {
    child_process.execSync(`sudo docker run -dp ${secrets.ip}:${secrets.port}:${secrets.port} webserver`, { stdio: 'inherit' })
}
