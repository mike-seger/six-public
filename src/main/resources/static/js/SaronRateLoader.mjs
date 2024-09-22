import { DateUtils as DU } from './utils/DateUtils.mjs'

function loadRates(data) {
	let objArray = null
	if(data.startsWith("ISIN;CH0049613687;")) {
		let csv = data.replace(/^ISIN;CH0049613687;.*$/mg, "")
			.replace(/^SYMBOL;SARON;;.*$/mg, "")
			.replace(/^NAME;Swiss.*$/mg, "")
			.trim()
		if(! csv.startsWith("Date;Close;"))
			throw("Expected Date;Close;... in SIX SARON CSV")
		csv = csv.replace(/Date;Close;/mg, "Date;SaronRate;")
			.replace(/; */mg, ",")
			.replace(/^([^,]*),([^,]*),.*/mg, "$1,$2")
			.replace(/^(..)\.(..)\.([12]...)/mg, "$3-$2-$1")
			.replaceAll(",", "\t")
		objArray = tsvParse(csv)
		if(objArray.length < 365)
			throw("Expected more that 365 rows in SIX SARON CSV")          
	} else {
		if(data.indexOf("\n")<0) throw ("Expected '\\n' linefeeds in data")
		if(data.indexOf(";")<0 && data.indexOf(",")<0 
			&& data.indexOf("\t")<0) throw ("Expected column separators ';,\\t' in data")
		data = data.replaceAll(";", "\t").replaceAll(",", "\t").trim()
		const header = data.substring(0, Math.max(0,data.indexOf("\n"))).trim()
		if(!header.match(/[12][0-9]{3}-[0-9]{2}-[0-9]{2}.*/))
			data = data.substring(Math.max(0,data.indexOf("\n"))).trim()
		data = "Date\tSaronRate\n"+data
		let sample = data.substring(Math.max(0, data.indexOf("\n"))).trim()
		sample = sample.substring(0, Math.max(0,sample.indexOf("\n"))).trim()
		if(!sample.match(/^[12][0-9]{3}-[0-9]{2}-[0-9]{2}.-*[0-9]+\.[0-9]{6}$/))
			throw (`Data sample (${sample}) doesn't match the expected format`)
		objArray = tsvParse(data)
	}
	return objArray
}

export function tsvParse(data) {
	if(!data.startsWith("Date\tSaronRate\n")) 
		throw ("Data must have a header line with:\n'Date\tSaronRate'")
	return data.replaceAll("\r", "").split("\n")
		.filter(line => !line.trim().startsWith("Date"))
		.map(line => {
			const tokens = line.split("\t")
			return { Date: tokens[0], SaronRate: tokens[1] }
		}
	)
}

function fillRates(csv) {
	const map = new Map()
	let prevEntry = null
	csv.sort((a, b) => a.Date.localeCompare(b.Date))
	csv.forEach((obj) => {
		const curDate = DU.localDate(obj.Date)
		const weekDay = curDate.getDay()
		if(weekDay==0 || weekDay==6)
			throw `Rates must be on business days: ${DU.isoDate(curDate)} is a ${weekDay==0?'Sunday':'Saturday'}`
	
		if(prevEntry != null) {
			const missingDays = DU.diffDays(prevEntry.date, curDate) - 1
			if(missingDays>6)
				throw (`Too many missing days (${missingDays}) between:\n
					${DU.isoDate(prevEntry.date)} and ${DU.isoDate(curDate)}`)
			if(missingDays>0) {
				prevEntry.rateWeight.weight = missingDays + 1
				const rate = prevEntry.rateWeight.rate
				let weight = missingDays
				let offset = 1
				do {
					let fillDate = DU.plusDays(prevEntry.date, offset++)
					map.set(fillDate, { rate: rate, weight: weight-- })
				} while(offset<=missingDays)
			}
		}
		const rateWeight = { rate: obj.SaronRate, weight: 1 }
		map.set(DU.isoDate(curDate), rateWeight )
		prevEntry = { date: curDate, rateWeight: rateWeight }
	})

	return map
}

export { loadRates, fillRates }
