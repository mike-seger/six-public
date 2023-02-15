import { plusDays, diffDays } from './DateUtils.mjs'
import { range, formattedRound } from './NumberUtils.mjs'

function doValidateRateMap(rateMap, startDate, endDate) {
	let date = startDate
	while(date < endDate) {
		let rateWeight = rateMap.get(date)
		if(rateWeight==null) throw("Missing rate for: "+date)       
		date = plusDays(date, 1)
	}
}

function compoundRate(rateMap, startDate, endDate, validateRateMap = true) {
	let date = startDate
	let product = 1
	while(date < endDate) {
		let rateWeight = rateMap.get(date)
		let weight = rateWeight.weight
		if(weight>1 && plusDays(date, weight) >= endDate)
			weight = diffDays(date, endDate)
		date = plusDays(date, weight)
		let factor = rateWeight.rate * weight/36000.0 + 1
		product *= factor
	}

	const result = (product - 1) * 36000.0 / diffDays(startDate, endDate)
	return { startDate: startDate, endDate: endDate, value: formattedRound(result, 4) }
}

function compundRateSeries(rateMap, startDate, endDate, all, allStartDates) {
	const compoundRates = []
	const dates = rateMap.keys()
	doValidateRateMap(rateMap, startDate, endDate)
	if(dates.length==0) throw new RuntimeException("No rates found")
	if(startDate >= endDate)
		throw(`Startdate (${startDate}) must be before endDate (${endDate})`)
	if(startDate < dates[0])
		throw("Startdate is before first rate date: "+dates[0])
	if(plusDays(endDate, -10) > dates[dates.length-1])
		throw("Enddate is after last rate date: "+dates[dates.length-1])
	if(all)
		range(0, diffDays(startDate, endDate)).forEach(
			offset => {
				const sd = plusDays(startDate, offset)
				const ed = plusDays(sd, 1)
				console.error("CR "+sd+"-"+ed+ " : "+endDate + " " + diffDays(startDate, sd) + " / " + compoundRates.length);
				if(allStartDates)
					range(0, diffDays(ed, endDate)+1).forEach(edOffset =>
						compoundRates.push(compoundRate(rateMap, sd, plusDays(ed, edOffset, false))
					))
				else compoundRates.push(compoundRate(rateMap, sd, endDate, false))            
			}
		)
	else compoundRates.push(compoundRate(rateMap, startDate, endDate));
	compoundRates.sort((a, b) => (a.startDate+a.endDate).localeCompare(b.startDate+b.endDate))
	return compoundRates
}

if(typeof importScripts === 'function') {
	self.addEventListener('message', function(e) {
		let p = e.data
		try {
			const procData = compundRateSeries(p.rateMap, p.startDate, p.endDate, p.all, p.allStartDates)
			postMessage({ type: 'saronCalculator', procData: procData, parse: false })
		} catch(err) {
			postMessage({ type: 'saronCalculator',  error: err })
		}
	}, false)
}

export { compoundRate, compundRateSeries }
