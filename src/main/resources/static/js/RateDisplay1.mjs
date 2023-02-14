
d3.csv("https://raw.githubusercontent.com/plotly/datasets/master/finance-charts-apple.csv", 
	function(err, rows) {

		function unpack(rows, key) {
			return rows.map(function(row) { return row[key]; })
		}

		var trace1 = {
		type: "scatter",
			mode: "lines",
			name: 'AAPL High',
			x: unpack(rows, 'Date'),
			y: unpack(rows, 'AAPL.High'),
			line: {color: '#17BECF'}
		}

		var data = [trace1]

		
		let margin = {
			t: 20, //top margin
			l: 20, //left margin
			r: 20, //right margin
			b: 20 //bottom margin
		}

		var layout = {
			title: 'SARON Rates',
			xaxis: {
				autorange: true,
				range: ['2015-02-17', '2017-02-16'],
				rangeselector: {buttons: [
					{
						count: 1,
						label: '1m',
						step: 'month',
						stepmode: 'backward'
					},
					{
						count: 6,
						label: '6m',
						step: 'month',
						stepmode: 'backward'
					},
					{step: 'all'}
					]},
				rangeslider: {range: ['2015-02-17', '2017-02-16']},
				type: 'date'
				},
			yaxis: {
				autorange: true,
				range: [86.8700008333, 138.870004167],
				type: 'linear'
			}
		}

		Plotly.newPlot('rate-display', data, layout, margin)
	}
)
