import fs from 'fs'
import os from 'os'

import { loadRates, fillRates, compoundRates } from './saronCompoundCalculator.mjs'
import { download } from './fileDownloader.mjs'

if (process.argv.length < 4) {
    console.error("Usage: saronCompound <startDate> <endDate> [all [allStartDates]]")
    process.exit(1)
}

async function loadRatesData() {
    const ratesFilePath = os.tmpdir()+"/hsrron.csv"
    const sixRatesUrl = "https://www.six-group.com/exchanges/downloads/indexdata/hsrron.csv"

    try {
        console.error("Checking rates file: "+ratesFilePath)
        if(fs.existsSync(ratesFilePath)) {
            const stats = fs.statSync(ratesFilePath)
            console.log(`File Data Last Modified: ${stats.mtime}`)
            console.log(`File Status Last Modified: ${stats.ctime}`)
            if(stats.ctime < new Date().setUTCHours(0, 0, 0, 0)) {
                console.error("Rates file is outdated. Re-downloading")
                fs.unlinkSync(ratesFilePath)
                await download(sixRatesUrl, ratesFilePath)
            }
        } else {
            await download(sixRatesUrl, ratesFilePath)
        }
        return fs.readFileSync(ratesFilePath, 'utf8')
    } catch (error) {
        throw(error)
    }
}

const startDate = process.argv[2]
const endDate = process.argv[3]
const all = process.argv.length > 4?process.argv[4]==='true' : false
const allStartDates = process.argv.length > 5?process.argv[5]=='true' : false

const csv = loadRates(await loadRatesData())
const rateMap = fillRates(csv)

console.log(JSON.stringify(compoundRates(rateMap, startDate, endDate, all, allStartDates)).replaceAll(",{","\n,{"))
