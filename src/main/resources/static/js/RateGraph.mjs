import { NumberUtils } from './utils/NumberUtils.mjs'
import { isoDate } from './utils/DateUtils.mjs'

let chart = create()
let pointClicked = undefined

function create() {
	function click(a,b,c,d,e,f) { 
		if(typeof pointClicked === 'function') {
			const i = c.dataPointIndex
			//chart.zoomX(0,0)
			//chart.resetSeries (true, true)
			pointClicked(isoDate(new Date(chart.data.twoDSeriesX[i])), chart.data.twoDSeries[i])
		}
	}

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
			},
			events: {
				click: click,
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
			hover: {
				size: 6,
				sizeOffset: 3
			}
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
			//enabled: false,
			shared: false,
			marker: {
				show: true,
			},
			x: {
				show: true,
				formatter: function(val) {
					const date = new Date(val)
					return isoDate(date)+": "+(""+date).replace(/.{8}:.*/,"")
				}
			},
			// y: {
			// 	show: true,
			// },
			y: {
				formatter: function(val) {
					return NumberUtils.formattedRound(Number(val), 6)
				},
				title: {
					formatter: (seriesName) => 'Rate',
				},
			},
			fixed: {
				enabled: true,
				position: 'topCenter',
				offsetX: 200,
				offsetY: 0,
			},
		},
		selection: {
			enabled: false,
			type: 'x',

			stroke: {
			  width: 0,
			//   dashArray: 3,
			//   color: '#24292e',
			//   opacity: 0.4
			},
			// xaxis: {
			// 	min: 5*24*60*60*1000,
			// 	max: undefined
			// },
		},
		theme: {
			palette: 'palette3'
		},

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

function addKeyListener(keyListener) {
	chart.el.addEventListener("keydown", keyListener)
}

function setPointClickCallback(callback) { pointClicked = callback }

function annotatePoint(isoDate, timeoutMs = 3500) {
	if(currentData) {
		if(currentTimeoutId) clearTimeout(currentTimeoutId)
		chart.clearAnnotations()
		const x = new Date(isoDate).getTime()
		const index = currentData.findIndex(dp => dp[0] == x)
		const xStart = chart.axes.w.globals.minX
		const xEnd = chart.axes.w.globals.maxX
		if(index>=0 && x>=xStart && x<=xEnd) {
			const y = currentData[index][1]
			const low = ((x-xStart)*1.0/(xEnd-xStart))<0.5
			const position = low?'right':'left'
			const textAnchor = low?'start':'end'
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
	annotatePoint,
	setPointClickCallback,
	addKeyListener,
}

export { RateGraph }
