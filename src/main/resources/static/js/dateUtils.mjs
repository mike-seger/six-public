function localDate(isoDateString) {
    return new Date(isoDateString.substring(0,10) + 'T00:00:00.000Z')
}

function diffDays(isoDate1, isoDate2) {
    return localDate(isoDate1).diffDays(localDate(isoDate2))
}

function plusDays(isoDate, days) {
    return localDate(isoDate).plusDays(days).toISONoTime()
}

export { localDate, diffDays, plusDays }