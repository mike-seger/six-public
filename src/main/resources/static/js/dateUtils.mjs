function localDate(isoDateString) {
    if(typeof isoDateString.getMonth === 'function')
        isoDateString = isoDate(isoDateString)
    return new Date(isoDateString.substring(0,10) + 'T00:00:00.000Z')
}

function diffDays(isoDate1, isoDate2) {
    var diff = localDate(isoDate2).setHours(12) - localDate(isoDate1).setHours(12)
    return Math.round(diff/8.64e7)
}

function isoDate(date) {
    return date.getFullYear() + "-"
        +("0" + (date.getMonth() + 1)).slice(-2) +"-"
        +("0" + date.getDate()).slice(-2)
}

function plusDays(isoDateStr, days) {
    if(typeof isoDateStr.getMonth === 'function')
        isoDateStr = isoDate(isoDateStr)
    const date = localDate(isoDateStr)
    date.setDate(date.getDate() + days)
    return isoDate(date)
}

function getPrevPeriod(date, period) {
    date = localDate(date)
    const month = date.getMonth()
    const currentQuarterMonth = month - month % period
    let prevPeriodMonth = currentQuarterMonth - period
    let year = date.getFullYear()
    if(prevPeriodMonth<0) { prevPeriodMonth += 12; year-- }
    const startDate = new Date(year, prevPeriodMonth, 1)
    const endDate = new Date(year, prevPeriodMonth+period, 0)    
    const start = isoDate(startDate)
    const end = isoDate(endDate)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]

    return { 
        start: start,
        end: end,
        year: year,
        year99: year % 100,
        sparts: start.split('-'),
        eparts: end.split('-'),
        sMonth: monthNames[startDate.getMonth()],
        eMonth: monthNames[endDate.getMonth()],
        n: (prevPeriodMonth / period)+1
    }
}

export { localDate, diffDays, plusDays, isoDate, getPrevPeriod }