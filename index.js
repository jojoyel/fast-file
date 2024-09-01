const express = require('express')
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')

require('dotenv').config()
require('./schedule')

const app = express()

const saveFolderName = process.env.FOLDER || 'files'

// Middlewares
app.use(bodyParser.json({ limit: '6mb' }))
app.use(fileUpload({
    limits: {fileSize: 5 * 1024 * 1024},

    useTempFiles: true,
    tempFileDir: './tmp/'
}))

// Send html form on root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'))
})

app.post('/upload', async (req, res, next) => {
    if (req.body.apikey === undefined)
        return res.status(400).send({result: 'Missing apikey'})

    const apikey = req.body.apikey

    const apikeys = JSON.parse(fs.readFileSync(path.join(__dirname, 'keys', 'keys.json'), 'utf8').toString())

    const foundApikey = apikeys.find(i => i.key === apikey)

    if (foundApikey === undefined)
        return res.status(400).send({result: 'Wrong apikey'})

    const originalFileName = req.body.filename

    if (originalFileName === undefined)
        return res.status(400).send({result: 'Missing filename'})

    const fileContent = Buffer.from(req.body.content, 'base64')
    console.log(fileContent)

    if (fileContent * 6 > 1024 * 1024 * 5)
        return res.status(413).send('File is too large.')

    const fileName = uuid.v4()
    const filePath = path.join(__dirname, saveFolderName, fileName)
    const infoFilePath = path.join(__dirname, saveFolderName, `${fileName}.INFO`)

    try {
        await fs.promises.writeFile(filePath, fileContent)

        fs.writeFileSync(infoFilePath, originalFileName)

        return res.status(200).send({result: fileName})
    } catch (err) {
        console.error('Error writing file:', err)
        return res.status(500).send({result: 'Error writing file'})
    }
})

app.post('/uploadfile', async (req, res, next) => {
    if (req.body.apikey === undefined)
        return res.status(400).send({result: 'Missing apikey'})

    const apikey = req.body.apikey

    const apikeys = JSON.parse(fs.readFileSync(path.join(__dirname, 'keys', 'keys.json'), 'utf8').toString())

    const foundApikey = apikeys.find(i => i.key === apikey)

    if (foundApikey === undefined)
        return res.status(400).send({result: 'Wrong apikey'})

    if (!req.files || !req.files.file || Object.keys(req.files).length === 0)
        return res.status(422).send({result: 'No files were uploaded'})

    if (req.files.file.truncated)
        return res.status(413).send('File is too large.')

    const fileName = uuid.v4()
    const filePath = path.join(__dirname, saveFolderName, fileName)
    const infoFilePath = path.join(__dirname, saveFolderName, `${fileName}.INFO`)

    const uploadedFile = req.files.file;

    try {
        await uploadedFile.mv(filePath, (err) => {
            if (err) {
                console.error('Error writing file:', err)
                return res.status(500).send({result: 'Error writing file'})
            }
        })

        fs.writeFileSync(infoFilePath, uploadedFile.name)

        return res.status(200).send({result: fileName})
    } catch (err) {
        console.error('Error writing file:', err)
        return res.status(500).send({result: 'Error writing file'})
    }
})

app.get('/download/:fileId', async (req, res, next) => {
    const id = req.params.fileId

    if (id === undefined || id.endsWith(".INFO"))
        return res.status(400).send({result: 'Invalid id'})

    try {
        const filePath = path.join(__dirname, saveFolderName, id)
        const filePathInfo = path.join(__dirname, saveFolderName, `${id}.INFO`)

        const realFileName = fs.readFileSync(filePathInfo, "utf8");

        console.log("real name", realFileName)

        // Send the file back to the client
        res.download(filePath, realFileName, (err) => {
            if (err) {
                console.error('Error sending file:', err)
                res.status(404).send({result: 'File not found'})
            } else {
                console.log('File sent:', id)
            }
        })
    } catch (err) {
        console.error(err)
        return res.status(500).send({result: 'File not found'})
    }
})

const port = process.env.PORT || 3002

app.listen(port, () => {
    console.log(`Listening closely (port ${port}) . . .`)
})