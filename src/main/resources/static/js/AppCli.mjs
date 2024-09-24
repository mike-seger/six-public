import fs from 'fs'
import os from 'os'

import { compoundRateSeries } from './SaronCompoundCalculator.mjs'
import { filteredTimeSeriesData, convertToTSV } from './SNB-rates-fetcher.mjs'
import { loadRates, fillRates, tsvParse } from './SaronRateLoader.mjs'
import { download } from './utils/FileDownloader.mjs'

if (process.argv.length < 4) {
	console.error("Usage: saronCompound <startDate> <endDate> [all [allStartDates]]")
	process.exit(1)
}

async function loadRatesData(ratesFilePath) {
	try {
		console.error("Checking rates file: "+ratesFilePath)
		if(!fs.existsSync(ratesFilePath)) {
			throw("Could not find: "+ratesFilePath)
		}
		console.error("Using rates file: "+ratesFilePath)
		return JSON.parse(fs.readFileSync(ratesFilePath, 'utf8'))
	} catch (error) {
		throw(error)
	}
}

const startDate = process.argv[2]
const endDate = process.argv[3]
const all = process.argv.length > 4?process.argv[4]==='true' : false
const allStartDates = process.argv.length > 5?process.argv[5]=='true' : false

const timeSeriesData = await loadRatesData('../data/snb-zinssaetze.json')
const series=filteredTimeSeriesData(timeSeriesData, "1900-01-01", "9999-12-31", 'EPB@SNB\\.zirepo\\{H0\\}')
const csv = tsvParse(convertToTSV(series))

const rateMap = fillRates(csv)

console.time('compoundRateSeries')
const result = compoundRateSeries(rateMap, startDate, endDate, all, allStartDates)
console.timeEnd('compoundRateSeries')
const resultStr = JSON.stringify(result).replaceAll(",{","\n,{")
    .replaceAll('[{"startDate":"', "\n")
    .replaceAll(',{"startDate":"', "")
    .replaceAll('","endDate":"', ",")
    .replaceAll('","value":"', ",")
    .replaceAll('"}', "")
    .replaceAll(']', "")

console.log('startDate,endDate,value'+resultStr)
