const fs = require('fs')
const path = require('path')
const os = require('os')
const child_process = require('child_process')
const { writeFile } = require('fs/promises')
const { Readable } = require('stream')

const app = require('express')()

const { hasArg, argParams } = require('./args_parser')
const { logReq, logFileDownload } = require('./logger')
const config = require('./config')
const secrets = hasArg('docker') ? {
    ip: argParams('docker', 3)[0],
    port: argParams('docker', 3)[1],
    publishReleaseString: argParams('docker', 3)[2],
} : require('./secrets')
const isHot = hasArg('hot')

const appDir = path.join(__dirname, 'app')
var currentDistDir = undefined

async function downloadDist(tag) {
    const url = config.distURL.replace('TAG_PLACEHOLDER', tag)
    logFileDownload(url)

    const response = await fetch(url)
    if (!response.ok) {
        throw new Error('Failed to download the file')
    }
    const stream = Readable.fromWeb(response.body)
    const tar = path.join(appDir, `${tag}.tar`)
    await writeFile(tar, stream)
    const newDistDir = fs.mkdtempSync(path.join(appDir, `${tag}-`))
    child_process.execSync(`tar -xf ${tar} -C ${newDistDir}`)
    const oldDistDir = currentDistDir
    currentDistDir = path.join(newDistDir, 'dist')
    fs.rmSync(tar)
    if (oldDistDir) {
        setTimeout(() => {
            fs.rmSync(oldDistDir, { force: true, recursive: true })
        }, config.keepOldDist)
    }
}

async function main() {
    fs.rmSync(appDir, { force: true, recursive: true })
    fs.mkdirSync(appDir)

    const tagsList = await (await fetch(config.tagsListURL)).json()
    const latest = tagsList[0].name

    await downloadDist(latest)

    app.get('/*', (req, res) => {
        logReq(req)

        const reqPath = `.${req.path == '/' ? '/index.html' : req.path}`
        const filePath = path.join(currentDistDir, reqPath)
        if (!fs.existsSync(path.join(currentDistDir, reqPath))) {
            res.sendStatus(404)
            return
        }
        if (!fs.statSync(path.join(currentDistDir, reqPath)).isFile) {
            res.sendStatus(403)
            return
        }
        res.sendFile(filePath)
    })

    if (isHot) {
        var prevUpdate = Date.now()

        app.post(`/${secrets.publishReleaseString}`, async (req, res) => {
            logReq(req)

            var now = Date.now()
            if (now <= prevUpdate + config.minUpdateFreq) {
                res.sendStatus(403)
                return
            }

            try {
                const tagsList = await (await fetch(config.tagsListURL)).json()
                const latest = tagsList[0].name
                await downloadDist(latest)
                prevUpdate = now
                res.sendStatus(200)
            } catch {
                res.sendStatus(500)
            }
        })
    }

    if (!hasArg('docker')) {
        app.listen(secrets.port, secrets.ip, () => {
            console.log(`The server is running on http://${secrets.ip}:${secrets.port}`)
        })
    } else {
        const interfaces = os.networkInterfaces()
        app.listen(secrets.port, interfaces.eth0[0].address)
    }
}

main()
