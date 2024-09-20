const fs = require('fs')
const path = require('path')
const os = require('os')
const child_process = require('child_process')
const { writeFile } = require('fs/promises')
const { Readable } = require('stream')

const app = require('express')()

const config = require('./config')
const secrets = process.argv[2] == 'docker' ? {
    ip: process.argv[3],
    port: process.argv[4],
    publishReleaseString: process.argv[5],
} : require('./secrets')
const isHot = process.argv[process.argv.length - 1] == 'hot'

const appDir = path.join(__dirname, 'app')
var currentDistDir = undefined

async function downloadDist(tag) {
    const response = await fetch(config.distURL.replace('TAG_PLACEHOLDER', tag));
    const stream = Readable.fromWeb(response.body)
    await writeFile(path.join(appDir, `${tag}.tar`), stream)
    const newDistDir = fs.mkdtempSync(path.join(appDir, `${tag}-`))
    child_process.execSync(`tar -xf ${path.join(appDir, `${tag}.tar`)} -C ${newDistDir}`)
    const oldDistDir = currentDistDir
    currentDistDir = path.join(newDistDir, 'dist')
    fs.rmSync(path.join(appDir, `${tag}.tar`))
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
        const reqPath = `.${req.path == '/' ? '/index.html' : req.path}`
        const filePath = path.join(currentDistDir, reqPath)
        console.log(filePath)
        console.log(fs.readdirSync(path.join(filePath, '..')))
        if (!fs.existsSync(path.join(currentDistDir, reqPath))) {
            res.sendStatus(404)
            return
        }
        res.sendFile(filePath)
    })

    if (isHot) {
        app.post(`/${secrets.publishReleaseString}`, async (req, res) => {
            const tagsList = await (await fetch(config.tagsListURL)).json()
            const latest = tagsList[0].name

            await downloadDist(latest)
            res.sendStatus(200)
        })
    }

    if (process.argv[2] !== 'docker') {
        app.listen(secrets.port, secrets.ip, () => {
            console.log(`The server is running on http://${secrets.ip}:${secrets.port}`)
        })
    } else {
        const interfaces = os.networkInterfaces()
        app.listen(secrets.port, interfaces.eth0[0].address)
    }
}

main()
