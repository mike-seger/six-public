function localDate(isoDateString) {
    return new Date(isoDateString.substring(0,10) + 'T00:00:00.000Z')
}

function diffDays(isoDate1, isoDate2) {
    return localDate(isoDate1).diffDays(localDate(isoDate2))
}

function plusDays(isoDate, days) {
    return localDate(isoDate).plusDays(days).toISONoTime()
}

function isoDate(date) {
    return date.getFullYear() + "-"
        +("0" + (date.getMonth() + 1)).slice(-2) +"-"
        +("0" + date.getDate()).slice(-2)
}

function getPrevPeriod(date, period) {
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