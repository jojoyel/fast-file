const sched = require('node-schedule')
const fs = require('fs')
const path = require('path')

const job = sched.scheduleJob('* */1 * * *', function() {
    console.info(`Starting execution at ${new Date}`)
    fs.readdir(path.join(__dirname, 'files'), (err, files) => {
        if (err) {
            console.error('Error reading directory: ', err)
            return
        }

        console.log(files)
        files.filter(f => f.endsWith(".INFO")).forEach(element => {
            fs.stat(path.join(__dirname, 'files', element), (err, result) => {
                if (err) {
                    console.error(`Error getting info of element ${element}: `, err)
                    return
                }

                const now = new Date()
                const timeDiff = now - result.birthtime
                const minutesDiff = timeDiff / (1000 * 60)

                if (minutesDiff > 60.0) {
                    fs.unlinkSync(path.join(__dirname, 'files', element))
                    fs.unlinkSync(path.join(__dirname, 'files', element.split('.')[0]))

                    console.info(`${element} deleted`)
                }
            })
        });
    })
    console.info(`Execution finished at ${new Date()}`)
})