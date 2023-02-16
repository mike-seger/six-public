import { formattedRound } from './NumberUtils.mjs'

let chart = createChart() 

function createChart() {
	var options = {
		series: [],
		chart: {
			type: 'area',
			stacked: false,
			height: 300,
			zoom: {
				type: 'x',
				enabled: true,
				autoScaleYaxis: true
			},
			toolbar: {
				autoSelected: 'zoom'
			}
		},
		dataLabels: {
			enabled: false
		},
		markers: {
			size: 0,
		},
		title: {
			text: 'SARON Rates',
			align: 'left'
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
					return formattedRound(Number(val), 3)
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
					return formattedRound(Number(val), 3)
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

function updateRateDisplay(data0) {
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

	chart.updateSeries([{
		name: 'SARON Rates',
		data: data
	}])
}

export { updateRateDisplay }
