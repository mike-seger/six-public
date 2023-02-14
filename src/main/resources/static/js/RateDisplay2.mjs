/*let data2 = [
	[new Date("1971-05-09").getTime(), 1.3],
	[new Date("1971-05-12").getTime(), 1.11],
	[new Date("1971-05-13").getTime(), 0.84],
	[new Date("1971-05-18").getTime(), 0.54]
]
*/
function updateRateDisplay(data0) {
	let data = data0
		.filter(elem => 
			elem.length==2
			&& elem[0].match(/^[12][0-9]{3}-[0-9]{2}-[0-9]{2}$/)
			&& elem[1].match(/-*[0-9]+\.[0-9]{6}$/)
		)
		.map(elem => [new Date(elem[0]).getTime(), Number(elem[1])])

	Highcharts.chart('container', {
		chart: {
			zoomType: 'x'
		},
		title: {
			text: 'SARON rate over time',
			align: 'left'
		},
		xAxis: {
			type: 'datetime'
		},
		yAxis: {
			title: {
				text: 'Rate'
			}
		},
		legend: {
			enabled: false
		},
		plotOptions: {
			area: {
				fillColor: {
					linearGradient: {
						x1: 0,
						y1: 0,
						x2: 0,
						y2: 1
					},
					// stops: [
					// 	[0, Highcharts.getOptions().colors[0]],
					// 	[1, Highcharts.color(Highcharts.getOptions()
					// 		.colors[0]).setOpacity(0).get('rgba')]
					// ]
				},
				marker: {
					radius: 2
				},
				lineWidth: 1,
				states: {
					hover: {
						lineWidth: 1
					}
				},
				threshold: null
			}
		},

		series: [{
			type: 'area',
			name: 'SARON rates',
			data: data
		}]
	})
}

export { updateRateDisplay }
