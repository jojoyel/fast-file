const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs').promises
const path = require('path')
const uuid = require('uuid')

const sched = require('./schedule')

var app = express()

app.use(bodyParser.json())

app.use(express.raw({ type: '*/*', limit: '5mb' }))

app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        res.status(413).send('Custom Error: Payload Too Large. Maximum allowed size is 5MB.')
    } else {
        next(err)
    }
})

app.post('/upload', async (req, res, next) => {

    const originalFileName = req.body.filename

    if (originalFileName === undefined)
        return res.status(400).send("Missing filename")

    const fileName = uuid.v4()
    const filePath = path.join(__dirname, 'files', fileName)
    const infoFilePath = path.join(__dirname, 'files', `${fileName}.INFO`)

    try {
        await fs.writeFile(filePath, Buffer.from(req.body.content, 'base64'))

        await fs.writeFile(infoFilePath, originalFileName)

        return res.status(200).send(fileName)
    } catch (err) {
        console.error('Error writing file:', err)
        return res.status(500).send('Error writing file')
    }
})

app.get('/download/:filename', async (req, res, next) => {
    const filename = req.params.filename
    
    if (filename === undefined || filename.endsWith(".INFO"))
        return res.status(400).send("U DONKEY")

    try {
        const filePath = path.join(__dirname, 'files', filename)
        const filePathInfo = path.join(__dirname, 'files', `${filename}.INFO`)

        var realFileName = await fs.readFile(filePathInfo, "utf8")

        console.log("real name", realFileName)

        // Send the file back to the client
        res.download(filePath, realFileName, (err) => {
            if (err) {
                console.error('Error sending file:', err)
                res.status(404).send('File not found')
            } else {
                console.log('File sent:', filename)
            }
        })
    } catch (err) {
        console.error(err)
        return res.status(500).send("No")
    }
})

app.listen(3002, () => {
    console.log("Listening closely . . .")
})