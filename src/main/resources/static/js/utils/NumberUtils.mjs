export function range(start, end) {
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

function round(n, decimals) {
	if (n < 0) return -round(-n, decimals)
	return +(Math.round(n + "e+" + decimals)  + "e-" + decimals)	
}

export function formattedRound(n, decimals) {
    if(n===undefined) return ''
	let s = round(round(n, decimals+5),decimals)+""
	if(s.indexOf(".")<0) s+=".0"
	if(decimals<=0) return s.substring(0,s.indexOf("."))
	const length = s.indexOf('.')+1+decimals
	return s.padEnd(length, '0')
}

var NumberUtils = {
	range, round, formattedRound
}

export { NumberUtils }