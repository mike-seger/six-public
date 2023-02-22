import { NumberUtils } from './utils/NumberUtils.mjs'

let chart = create() 

function create() {
	var options = {
		series: [],
		chart: {
			//foreColor: '#ccc',
			type: 'area',
			stacked: false,
			height: 300,
			zoom: {
				// type: 'xy',
				type: 'x',
				enabled: true,
				autoScaleYaxis: true
			},
			toolbar: {
				autoSelected: 'zoom'
			}
		},
		grid: {
			padding: {
				left: 8,
				right: 36
			}
		},
		//colors:['#FFFFFF', '#FFFFFF', '#FFFFFF'],
		dataLabels: {
			enabled: false,
		},
		markers: {
			size: 0,
			//colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF']
		},
		title: {
			text: 'SARON Rates',
			align: 'left'
		},
		stroke: {
			curve: 'stepline',
			width: 2,
		},
		fill: {
			type: 'gradient',
			gradient: {
				shadeIntensity: 1,
				inverseColors: false,
				opacityFrom: 0.5,
				opacityTo: 0,
				stops: [0, 90, 100]
			},
		},
		yaxis: {
			labels: {
				formatter: function(val) {
					return NumberUtils.formattedRound(Number(val), 3)
				},
			},
			title: {
				text: 'Rate'
			},
		},
		xaxis: {
			type: 'datetime',
		},
		tooltip: {
			shared: false,
			y: {
				formatter: function(val) {
					return NumberUtils.formattedRound(Number(val), 3)
				}
			}
		},
		theme: {
			palette: 'palette3'
		}
	}

	let chart = new ApexCharts(document.querySelector("#rate-display"), options)
	chart.render()
	return chart
}

let currentData = undefined
let currentTimeoutId = undefined

function update(data0) {
	const data = data0.filter(elem => 
		elem.length==2
		&& elem[0].match(/^[12][0-9]{3}-[0-9]{2}-[0-9]{2}.*/)
		&& elem[1].match(/-*[0-9]+\.[0-9]{6}$/)
	).map(elem => {
		return [
			new Date(elem[0]).getTime(),
			Number(elem[1])
		]
	})
	data.sort((a,b) => a[0] - b[0])
	currentData = data

	chart.updateSeries([{
		name: 'SARON Rates',
		data: data
	}])
}

function annotatePoint(isoDate, timeoutMs = 3500) {
	if(currentData) {
		if(currentTimeoutId) clearTimeout(currentTimeoutId)
		chart.clearAnnotations()
		const x = new Date(isoDate).getTime()
		const index = currentData.findIndex(dp => dp[0] == x)
		if(index>=0) {
			const y = currentData[index][1]
			const low = index > currentData.length/2
			const position = low?'left':'right'
			const textAnchor = low?'end':'start'
			chart.addPointAnnotation({ x: x, y: y, 
				marker: {
					size: 4,
					fillColor: "rgb(230, 77, 192)",
					strokeWidth: 0,
					shape: "circle",
					radius: 1,
				},
				label: { 
					borderColor: "#00E396",
					style: { cssClass: 'point-annotation' },
					position: position,
					textAnchor: textAnchor,
					text: isoDate + ": " + NumberUtils.formattedRound(y, 6)
				}})
		}
		currentTimeoutId = setTimeout(() => chart.clearAnnotations(), String(timeoutMs))
	}
}

var RateGraph = {
	update, 
	annotatePoint
}

export { RateGraph }
