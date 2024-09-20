const fs = require('fs')
const child_process = require('child_process')

const secrets = require('./secrets')

if (process.argv[2] == 'build') {
    fs.rmSync('Dockerfile', { force: true })
    fs.writeFileSync('Dockerfile', `
FROM node:22-alpine
WORKDIR .
COPY ./package.json ./package-lock.json ./main.js ./config.js ./
RUN npm i
CMD node main.js docker ${secrets.ip} ${secrets.port} ${secrets.publishReleaseString} ${process.argv[3]}
EXPOSE ${secrets.port}
`)
    child_process.execSync(`sudo docker build -t webserver .`, { stdio: 'inherit'})
} else if (process.argv[2] == 'run') {
    child_process.execSync(`sudo docker run -dp ${secrets.ip}:${secrets.port}:${secrets.port} webserver`, { stdio: 'inherit' })
}
