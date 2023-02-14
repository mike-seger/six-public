import { localDate, plusDays, diffDays, isoDate } from './dateUtils.mjs'

//TODO fix this browser/CLI compatibility workaround
let csvParse = null
let tsvParse = null
if(typeof Window === 'undefined') {
    //node doesn't like importing https://...
    const myD3 = (await import('./d3-dsv@3.js')).default
    csvParse = myD3.csvParse
    tsvParse = myD3.tsvParse
} else {
    csvParse = d3.csvParse
    tsvParse = d3.tsvParse
} 

function loadRates(data) {
    let csv = null
    if(data.startsWith("ISIN;CH0049613687;")) {
        csv = data.replace(/^ISIN;CH0049613687;.*$/mg, "")
            .replace(/^SYMBOL;SARON;;.*$/mg, "")
            .replace(/^NAME;Swiss.*$/mg, "")
            .trim()
        if(! csv.startsWith("Date;Close;"))
            throw("Expected Date;Close;... in SIX SARON CSV")
        csv = csv.replace(/Date;Close;/mg, "Date;SaronRate;")
            .replace(/; */mg, ",")
            .replace(/^([^,]*),([^,]*),.*/mg, "$1,$2")
            .replace(/^(..)\.(..)\.([12]...)/mg, "$3-$2-$1")
        csv = csvParse(csv)
        if(csv.length < 365)
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
            throw (`Data sanple (${sample}) doesn't match the expected format`)
        csv = tsvParse(data)
    }
    return csv
}

Date.prototype.diffDays = function(date) {
  var diff = date.setHours(12) - this.setHours(12)
  return Math.round(diff/8.64e7)
}

Date.prototype.plusDays = function(days) {
    const date = new Date(this)
    date.setDate(date.getDate() + days)
    return date
}

function range(start, end) {
    const sign = start > end ? -1 : 1;
    return Array.from(
        { length: Math.abs(end - start) },
        (_, i) => start + i * sign
    )
}

Number.prototype.round = function(decimals) {
    if (this < 0) return -(-this).round(decimals)
    return +(Math.round(this + "e+" + decimals)  + "e-" + decimals)
}

function formattedRound(num, decimals) {
    let s = (num.round(decimals+5).round(decimals)+"")
    if(s.indexOf(".")<0) s+=".0"
    if(decimals<=0) return s.substring(0,s.indexOf("."))
    const length = s.indexOf('.')+1+decimals
    return s.padEnd(length, '0')
}

function fillRates(csv) {
    const map = new Map()
    let prevEntry = null
    csv.sort((a, b) => a.Date.localeCompare(b.Date))
    csv.forEach((obj) => {
        const curDate = localDate(obj.Date)
        const weekDay = curDate.getDay()
        if(weekDay==0 || weekDay==6)
            throw `Rates must be on business days: ${isoDate(curDate)} is a ${weekDay==0?'Sunday':'Saturday'}`
    
        if(prevEntry != null) {
            const missingDays = prevEntry.date.diffDays(curDate) - 1
            if(missingDays>4) 
                throw (`Too many missing days (${missingDays}) between:\n
                    ${isoDate(prevEntry.date)} and ${isoDate(curDate)}`)
            if(missingDays>0) {
                prevEntry.rateWeight.weight = missingDays + 1
                const rate = prevEntry.rateWeight.rate
                let weight = missingDays
                let offset = 1
                do {
                    let fillDate = prevEntry.date.plusDays(offset++)
                    map.set(isoDate(fillDate), { rate: rate, weight: weight-- })
                } while(offset<=missingDays)
            }
        }
        const rateWeight = { rate: obj.SaronRate, weight: 1 }
        map.set(isoDate(curDate), rateWeight )
        prevEntry = { date: curDate, rateWeight: rateWeight }
    })

    return map
}

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
    if(validateRateMap) doValidateRateMap(rateMap, startDate, endDate)
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

async function compoundRates(rateMap, startDate, endDate, all, allStartDates) {
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

export { loadRates, fillRates, compoundRate, compoundRates }