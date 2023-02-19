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
	if(onlyWeekdays === undefined || ! (typeof isBankHoliday === 'function'))
		isBankHoliday = function(date) { onlyWeekdays?!isWeekDay(localDate(date)):false }
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

const swissBankHolidayRawCache = [ //cacheSwissHolidays()
	{1990:["01-01","01-02","04-13","04-16","05-01","05-24","06-04","08-01","12-25","12-26"]},
	{1991:["01-01","01-02","03-29","04-01","05-01","05-09","05-20","08-01","12-25","12-26"]},
	{1992:["01-01","01-02","04-17","04-20","05-01","05-28","06-08","08-01","12-25","12-26"]},
	{1993:["01-01","01-02","04-09","04-12","05-01","05-20","05-31","08-01","12-25","12-26"]},
	{1994:["01-01","01-02","04-01","04-04","05-01","05-12","05-23","08-01","12-25","12-26"]},
	{1995:["01-01","01-02","04-14","04-17","05-01","05-25","06-05","08-01","12-25","12-26"]},
	{1996:["01-01","01-02","04-05","04-08","05-01","05-16","05-27","08-01","12-25","12-26"]},
	{1997:["01-01","01-02","03-28","03-31","05-01","05-08","05-19","08-01","12-25","12-26"]},
	{1998:["01-01","01-02","04-10","04-13","05-01","05-21","06-01","08-01","12-25","12-26"]},
	{1999:["01-01","01-02","04-02","04-05","05-01","05-13","05-24","08-01","12-25","12-26"]},
	{2000:["01-01","01-02","04-21","04-24","05-01","06-01","06-12","08-01","12-25","12-26"]},
	{2001:["01-01","01-02","04-13","04-16","05-01","05-24","06-04","08-01","12-25","12-26"]},
	{2002:["01-01","01-02","03-29","04-01","05-01","05-09","05-20","08-01","12-25","12-26"]},
	{2003:["01-01","01-02","04-18","04-21","05-01","05-29","06-09","08-01","12-25","12-26"]},
	{2004:["01-01","01-02","04-09","04-12","05-01","05-20","05-31","08-01","12-25","12-26"]},
	{2005:["01-01","01-02","03-25","03-28","05-01","05-05","05-16","08-01","12-25","12-26"]},
	{2006:["01-01","01-02","04-14","04-17","05-01","05-25","06-05","08-01","12-25","12-26"]},
	{2007:["01-01","01-02","04-06","04-09","05-01","05-17","05-28","08-01","12-25","12-26"]},
	{2008:["01-01","01-02","03-21","03-24","05-01","05-01","05-12","08-01","12-25","12-26"]},
	{2009:["01-01","01-02","04-10","04-13","05-01","05-21","06-01","08-01","12-25","12-26"]},
	{2010:["01-01","01-02","04-02","04-05","05-01","05-13","05-24","08-01","12-25","12-26"]},
	{2011:["01-01","01-02","04-22","04-25","05-01","06-02","06-13","08-01","12-25","12-26"]},
	{2012:["01-01","01-02","04-06","04-09","05-01","05-17","05-28","08-01","12-25","12-26"]},
	{2013:["01-01","01-02","03-29","04-01","05-01","05-09","05-20","08-01","12-25","12-26"]},
	{2014:["01-01","01-02","04-18","04-21","05-01","05-29","06-09","08-01","12-25","12-26"]},
	{2015:["01-01","01-02","04-03","04-06","05-01","05-14","05-25","08-01","12-25","12-26"]},
	{2016:["01-01","01-02","03-25","03-28","05-01","05-05","05-16","08-01","12-25","12-26"]},
	{2017:["01-01","01-02","04-14","04-17","05-01","05-25","06-05","08-01","12-25","12-26"]},
	{2018:["01-01","01-02","03-30","04-02","05-01","05-10","05-21","08-01","12-25","12-26"]},
	{2019:["01-01","01-02","04-19","04-22","05-01","05-30","06-10","08-01","12-25","12-26"]},
	{2020:["01-01","01-02","04-10","04-13","05-01","05-21","06-01","08-01","12-25","12-26"]},
	{2021:["01-01","01-02","04-02","04-05","05-01","05-13","05-24","08-01","12-25","12-26"]},
	{2022:["01-01","01-02","04-15","04-18","05-01","05-26","06-06","08-01","12-25","12-26"]},
	{2023:["01-01","01-02","04-07","04-10","05-01","05-18","05-29","08-01","12-25","12-26"]},
	{2024:["01-01","01-02","03-29","04-01","05-01","05-09","05-20","08-01","12-25","12-26"]},
	{2025:["01-01","01-02","04-18","04-21","05-01","05-29","06-09","08-01","12-25","12-26"]},
	{2026:["01-01","01-02","04-03","04-06","05-01","05-14","05-25","08-01","12-25","12-26"]},
	{2027:["01-01","01-02","03-26","03-29","05-01","05-06","05-17","08-01","12-25","12-26"]},
	{2028:["01-01","01-02","04-14","04-17","05-01","05-25","06-05","08-01","12-25","12-26"]},
	{2029:["01-01","01-02","03-30","04-02","05-01","05-10","05-21","08-01","12-25","12-26"]},
	{2030:["01-01","01-02","04-19","04-22","05-01","05-30","06-10","08-01","12-25","12-26"]},
	{2031:["01-01","01-02","04-11","04-14","05-01","05-22","06-02","08-01","12-25","12-26"]},
	{2032:["01-01","01-02","03-26","03-29","05-01","05-06","05-17","08-01","12-25","12-26"]},
	{2033:["01-01","01-02","04-15","04-18","05-01","05-26","06-06","08-01","12-25","12-26"]},
	{2034:["01-01","01-02","04-07","04-10","05-01","05-18","05-29","08-01","12-25","12-26"]},
	{2035:["01-01","01-02","03-23","03-26","05-01","05-03","05-14","08-01","12-25","12-26"]},
	{2036:["01-01","01-02","04-11","04-14","05-01","05-22","06-02","08-01","12-25","12-26"]},
	{2037:["01-01","01-02","04-03","04-06","05-01","05-14","05-25","08-01","12-25","12-26"]},
	{2038:["01-01","01-02","04-23","04-26","05-01","06-03","06-14","08-01","12-25","12-26"]},
	{2039:["01-01","01-02","04-08","04-11","05-01","05-19","05-30","08-01","12-25","12-26"]}
]

function rawCache2Cache(rawCache) {
	const cache = new Map()
	rawCache.map(entry => 
		cache.set(
			String(Object.keys(entry)[0]), 
			Object.values(entry)[0].map(dm => 
				String(Object.keys(entry)[0])+"-"+dm))
	)
	return cache
}
const swissBankHolidayCache = rawCache2Cache(swissBankHolidayRawCache)

function isSwissBankHoliDay(isoDate) {
	let result = true
	if(isWeekDay(localDate(isoDate))) {
		const year = String(isoDate).substring(0,4)
		let holidays = swissBankHolidayCache.get(year)
		if(!holidays) swissBankHolidayCache.set(String(year), swissBankHolidaysIso(year))
		if(! swissBankHolidayCache.get(String(isoDate).substring(0,4)).includes(isoDate))
			result = false
	}
	return result
}

function test() {
	console.log(swissBankHolidayCache)
	isSwissBankHoliDay("2023-04-07")
	isSwissBankHoliDay("2023-04-10")
	isSwissBankHoliDay("2023-05-18")
	isSwissBankHoliDay("2023-05-29")
	isSwissBankHoliDay("2023-05-29")
	plusSwissWorkingDays("2023-04-07", 1)
}

test()

var DateUtils = {
	localDate: localDate,
	diffDays: diffDays,
	plusDays: plusDays,
	plusSwissWorkingDays: plusSwissWorkingDays,
	isSwissBankHoliDay: isSwissBankHoliDay,
	isoDate: isoDate,
	getPrevPeriod: getPrevPeriod,
}
export { DateUtils /*, localDate, diffDays, plusDays, plusSwissWorkingDays, 
isSwissBankHoliDay, isoDate, getPrevPeriod*/ }
