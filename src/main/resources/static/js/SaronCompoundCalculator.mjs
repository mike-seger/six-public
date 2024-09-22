import { DateUtils as DU } from './utils/DateUtils.mjs'
import { NumberUtils } from './utils/NumberUtils.mjs'

function doValidateRateMap(rateMap, startDate, endDate) {
	let date = startDate
	while(date < endDate) {
		let rateWeight = rateMap.get(date)
		if(rateWeight==null) throw("Missing rate for: "+date)       
		date = DU.plusDays(date, 1)
	}
}

function compoundRate(rateMap, startDate, endDate, validateRateMap = true) {
	let date = startDate
	let product = 1
	while(date < endDate) {
		let rateWeight = rateMap.get(date)
		let weight = rateWeight.weight
		if(weight>1 && DU.plusDays(date, weight) >= endDate)
			weight = DU.diffDays(date, endDate)
		date = DU.plusDays(date, weight)
		let factor = rateWeight.rate * weight/36000.0 + 1
		product *= factor
	}

	const result = (product - 1) * 36000.0 / DU.diffDays(startDate, endDate)
	return { startDate: startDate, endDate: endDate, value: NumberUtils.formattedRound(result, 4) }
}

function compoundRateSeries(rateMap, startDate, endDate, all, allStartDates) {
	//console.log(rateMap, startDate, endDate, all, allStartDates)
	const compoundRates = []
	const dates = rateMap.keys()
	doValidateRateMap(rateMap, startDate, endDate)
	if(dates.length==0) throw new RuntimeException("No rates found")
	if(startDate >= endDate)
		throw(`Startdate (${startDate}) must be before endDate (${endDate})`)
	if(startDate < dates[0])
		throw("Startdate is before first rate date: "+dates[0])
	if(DU.plusDays(endDate, -10) > dates[dates.length-1])
		throw("Enddate is after last rate date: "+dates[dates.length-1])
	if(all)
		NumberUtils.range(0, DU.diffDays(startDate, endDate)).forEach(
			offset => {
				const sd = DU.plusDays(startDate, offset)
				const ed = DU.plusDays(sd, 1)
				//console.error("CR "+sd+"-"+ed+ " : "+endDate + " " + DU.diffDays(startDate, sd) + " / " + compoundRates.length);
				if(allStartDates)
					NumberUtils.range(0, DU.diffDays(ed, endDate)+1).forEach(edOffset =>
						compoundRates.push(compoundRate(rateMap, sd, DU.plusDays(ed, edOffset, false))
					))
				else compoundRates.push(compoundRate(rateMap, sd, endDate, false))            
			}
		)
	else compoundRates.push(compoundRate(rateMap, startDate, endDate))
	console.log(`Sort ${compoundRates.length} rates`)
	compoundRates.sort((a, b) => (a.startDate+a.endDate).localeCompare(b.startDate+b.endDate))
	console.log(`${compoundRates.length} rates calculated`)
	return compoundRates
}

if(typeof importScripts === 'function') {
	self.addEventListener('message', function(e) {
		let p = e.data
		try {
			const procData = compoundRateSeries(p.rateMap, p.startDate, p.endDate, p.all, p.allStartDates)
			postMessage({ type: 'saronCalculator', procData: procData, parse: false })
		} catch(err) {
			postMessage({ type: 'saronCalculator',  error: err })
		}
	}, false)
}

export { compoundRate, compoundRateSeries }
