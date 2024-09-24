import { plusDays, diffDays } from './utils/DateUtils.mjs'
import { range, formattedRound } from './utils/NumberUtils.mjs'

function doValidateRateMap(rateMap, startDate, endDate) {
	let date = startDate
	while(date < endDate) {
		let rateWeight = rateMap.get(date)
		if(rateWeight==null) throw("Missing rate for: "+date)       
		date = plusDays(date, 1)
	}
}

function compoundRateSlow(rateMap, startDate, endDate) {
	let date = startDate
	let product = 1
	while(date < endDate) {
		let rateWeight = rateMap.get(date)
		//console.error("rateWeightS", rateWeight, startDate, date, endDate)
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

function compoundRate(rateArray, start, end) {
	let i = start
	let product = 1
	while(i < end) {
		const rateWeight = rateArray[i][1]
		//console.error("rateWeight", rateWeight, start, i, end)
		let weight = rateWeight.weight
		if(weight>1 && i+weight >= end)
			weight = end-i
		i = i+weight
		let factor = rateWeight.rate * weight/36000.0 + 1
		product *= factor
	}

	const result = (product - 1) * 36000.0 / (end - start)
	return [ start, end, result ]
}

function compoundRateSeries(rateMap, startDate, endDate, all, allStartDates) {
	//console.log(rateMap, startDate, endDate, all, allStartDates)
	const compoundRates = []
	const dates = rateMap.keys()
	doValidateRateMap(rateMap, startDate, endDate)
	if(dates.length==0) throw new RuntimeException("No rates found")
	if(startDate >= endDate)
		throw(`StartDate (${startDate}) must be before endDate (${endDate})`)
	if(startDate < dates[0])
		throw("StartDate is before first rate date: "+dates[0])
	if(plusDays(endDate, -10) > dates[dates.length-1])
		throw("EndDate is after last rate date: "+dates[dates.length-1])
    const rateArray = Array.from(
        rateMap.entries().filter(([date, rate]) => date >= startDate && date <= endDate,
        ([date, rate]) => ({ date, rate })))

    endDate = plusDays(rateArray[rateArray.length-1][0], 1)
    rateArray.push([endDate, { rate: '0.0', weight: 1 }])
    console.error("rateArray length: "+rateArray.length)
	const start = 0
	const end = diffDays(startDate, endDate)
	if(all)
		range(0, end).forEach(
			offset => {
				if(allStartDates)
					range(0, end-offset).forEach(edOffset => {
						const cr = compoundRate(rateArray, offset, offset+edOffset+1)
						compoundRates.push(cr)
					})
				else compoundRates.push(compoundRate(rateArray, offset, offset+1))
			}
		)
	else compoundRates.push(compoundRate(rateArray, 0, end))
	console.error(`${compoundRates.length} rates calculated`)
    const compoundRatesResult = []
    compoundRates.forEach(cr => compoundRatesResult.push(
        { startDate: rateArray[cr[0]][0], endDate: rateArray[cr[1]][0], value: formattedRound(cr[2], 4) }
    ))
	return compoundRatesResult
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
