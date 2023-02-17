import { range } from './NumberUtils.mjs'

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

function isWeekDay(date) {
	return !(date.getDay() === 6 || date.getDay() === 0)
}

function plusDays(isoDateStr, days, onlyWeekdays) {
	let isBankHoliday = onlyWeekdays
	if(onlyWeekdays === undefined || ! typeof isBankHoliday === 'function') {
		isBankHoliday = (date) => onlyWeekdays?!isWeekDay(localDate(date)):false
	} else {
		console.log("")
	}
	if(typeof isoDateStr.getMonth === 'function')
		isoDateStr = isoDate(isoDateStr)
	const date = localDate(isoDateStr)
	let resDate = new Date(date)
	const delta = days>=0? 1 : -1
	let maxExtraloops = 10
	do {
		resDate = new Date(date)
		resDate.setDate(date.getDate() + days)
		days += delta
	} while(--maxExtraloops>0 && isBankHoliday(isoDate(resDate)))
	return isoDate(resDate)
}

function plusSwissWorkingDays(isoDateStr, days) {
	const result = plusDays(isoDateStr, days, isSwissBankHoliDay)
	console.log(isoDateStr, days, result)
	return result
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

/*
https://stackoverflow.com/questions/1284314/easter-date-in-javascript
https://www.contextures.com/exceleastercalculation.html
Laurent Longre Algorithm
Accuracy: This algorithm is definitely worthy of mention. It is the shortest of all to implement, and it is the fastest running of the group by roughly a factor of 2. It is in 100% agreement with both the U.S. Naval Observatory (USNO) and Astronomical Society of Southern Australia (ASSA) calculations from 1900 through 6553. After 6553, the algorithm returns the #INVALID! error.
Speed: The average time to execute was 4.85675 microseconds (4.85675E-06 seconds).
Note: For years prior to 1900, or for overflow errors, see suggestions below the code
*/
function easterDate(Y) {
  let M=3, G= Y % 19+1, C= ~~(Y/100)+1, L=~~((3*C)/4)-12,
      E=(11*G+20+ ~~((8*C+5)/25)-5-L)%30, D;
  E<0 && (E+=30);
  (E==25 && G>11 || E==24) && E++;
  (D=44-E)<21 && (D+=30);
  (D+=7-(~~((5*Y)/4)-L-10+D)%7)>31 && (D-=31,M=4);
  return [Y, M, D];
}
function easterDateIso(isoDate) { return datePartsToIsoString(easterDate(String(isoDate).substring(0,4))) }
function ascensionDayIso(isoDate) { return plusDays(easterDateIso(String(isoDate).substring(0,4)), 39) }
function ascensionDay(Y) { return ascensionDayIso(Y).split("-") }
function whitSundayIso(isoDate) { return plusDays(easterDateIso(String(isoDate).substring(0,4)), 49) }
function whitSunday(Y) { return whitSundayIso(Y).split("-") }
function datePartsToIsoString(dateParts) {
	return dateParts[0] + "-" +  String(dateParts[1]).padStart(2, '0') + "-" + String(dateParts[2]).padStart(2, '0')
}

function swissBankHolidaysIso(isoDate) {
	const year = Number(String(isoDate).substring(0,4))
	return [
		`${year}-01-01`, // New Years's Day
		`${year}-01-02`, //	Berchtold's Day
		plusDays(easterDateIso(isoDate), -2), //Goodfriday
		plusDays(easterDateIso(isoDate), 1), // Easter Monday
		`${year}-05-01`, // Labour Day
		ascensionDayIso(isoDate), // Ascension
		plusDays(whitSundayIso(isoDate), 1), // Whit Monday
		`${year}-08-01`, //	Federal holiday
		`${year}-12-25`, // Christmas Day
		`${year}-12-26`, // Boxing Day
	]
}

function cacheSwissHolidays() {
	const cache = new Map()
	range(1990, 2040).map(year => cache.set(String(year), swissBankHolidaysIso(year)))
	return cache
}

let swissBankHolidayCache = cacheSwissHolidays()

function isSwissBankHoliDay(isoDate) {
	let result = true
	if(isWeekDay(localDate(isoDate))) {
		const year = String(isoDate).substring(0,4)
		let holidays = swissBankHolidayCache.get(year)
		if(!holidays) cache.set(String(year), swissBankHolidaysIso(year))
		if(! swissBankHolidayCache.get(String(isoDate).substring(0,4)).includes(isoDate))
			result = false
	}
	console.log(isoDate, result)
	return result
}

function test() {
	isSwissBankHoliDay("2023-04-07")
	isSwissBankHoliDay("2023-04-10")
	isSwissBankHoliDay("2023-05-18")
	isSwissBankHoliDay("2023-05-29")
	isSwissBankHoliDay("2023-05-29")
	plusSwissWorkingDays("2023-04-07", 1)
}

test()

// console.log(
// 	// easterDate(2023),easterDate(2024),easterDate(2025),easterDate(2026),easterDate(2027),
// 	// "2023", swissBankHolidaysIso("2023"),
// 	// "2024", swissBankHolidaysIso("2024"),
// 	// "2025", swissBankHolidaysIso("2025"),
// 	// "2026", swissBankHolidaysIso("2026"),
// 	// "2027", swissBankHolidaysIso("2027")
// )

export { localDate, diffDays, plusDays, plusSwissWorkingDays, isoDate, getPrevPeriod }
