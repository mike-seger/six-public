import { loadRates, fillRates } from './SaronRateLoader.mjs'
import { getPrevPeriod, plusDays } from './DateUtils.mjs'
import { updateRateDisplay } from './RateDisplay.mjs'
import { Spinner } from './Spinner.mjs'

let saronCalculator = null

const serverMessage = document.getElementById('serverMessage')
const serverText = document.getElementById('serverText')
const saronInfoMessage = document.getElementById('saronInfoMessage')
const saronInfo = document.getElementById('saronInfo')
const startDate = document.getElementById('startdate')
const endDate = document.getElementById('enddate')
const allStartDates = document.getElementById('allStartDates')
const offline = document.getElementById('offline')
const offlineParameter = document.getElementById('offline-parameter')
const importButton = document.getElementById('import')
const exportButton = document.getElementById('export')

const exportParameters = document.getElementById('export-parameters')
const customParameters = document.getElementById('custom-parameters')

let maxDate = new Date()
let minDate = maxDate
let chooserData = createExportChooserData()

const importChooser = jSuites.dropdown(document.getElementById('import-chooser'), {
	data: [
		{ value: "SaronRatesUpload", text: "File..." },
		{ value: "Local saron-2022.tsv", text: "2022" },
		{ value: "Local saron-2021.tsv", text: "2021" },
		{ value: "Local saron-2020.tsv", text: "2020" },
		{ value: "Local saron-2019.tsv", text: "2019" },
	],
	onchange: importFile,
	width: '100px'
})

jSuites.calendar(startDate,{ format: 'YYYY-MM-DD' })
jSuites.calendar(endDate,{ format: 'YYYY-MM-DD' })
const exportChooser = jSuites.dropdown(document.getElementById('export-chooser'), {
	data: chooserData,
	onchange: function(el,val) { exportChooserChanged(val); }
})

function createExportChooserData() {
	let date = maxDate
	const prevQuarter = getPrevPeriod(date, 3)
	const prevSemester = getPrevPeriod(date, 6)
	const prevYear = getPrevPeriod(date, 12)
	const semQuarter = (prevSemester.n-1)*2
	const data = [
		{ group:'Predefined Ranges', value: `${prevQuarter.start} ${prevQuarter.end}`, 
			text: `Q${prevQuarter.n} '${prevQuarter.year99} (${prevQuarter.sMonth}-${prevQuarter.eMonth})` },
		{ group:'Predefined Ranges', value: `${prevSemester.start} ${prevSemester.end}`, 
			text: `Q${semQuarter}+Q${semQuarter+1} '${prevSemester.year99} (${prevSemester.sMonth}-${prevSemester.eMonth})` },
		{ group:'Predefined Ranges', value: `${prevYear.start} ${prevYear.end}`, 
			text: `${prevYear.year} (${prevYear.sMonth}-${prevYear.eMonth})` },
		{ group:'Predefined Ranges', value: `${minDate} ${maxDate}`, 
			text: `All (${minDate} - ${maxDate})` },
		{ group:'Custom Range', value:'custom', 
			text:'Range...' },
	]

	return data
}

function initParameters() {
	importChooser.setValue("")
	exportChooser.setValue(chooserData[0].value)
	offline.checked = true
	allStartDates.checked = true
	if(window.location.host.indexOf("mike-seger.github.io")>=0) {
		offlineParameter.style.display = "none"
	}
	exportParameters.style.display = "none"
}

function ratesChanged(instance) {
	console.log("Rates changed")
	const data = instance.jexcel.getData()

	setTimeout(function() {
		updateRateDisplay(data)
	}, 100)

	const validData = data
		.filter(rate => rate.length == 2)
		.filter(rate => rate[0].match(/^[12]...-..-...*/))
	if(validData.length>0) {
		const dates = validData.map(rate => rate[0])
		dates.sort()
		minDate = dates[0].substring(0,10)
		maxDate = plusDays(new Date(dates[dates.length-1].substring(0,10)), 1)
		chooserData = createExportChooserData()
		exportChooser.setData(chooserData)
		exportChooserChanged(exportChooser)
		exportChooser.setValue(chooserData[0].value)
		exportParameters.style.display = "block"
	} else {
		exportParameters.style.display = "none"
	}
	//console.log("Data: "+validData)
}

const saronTable = jspreadsheet(document.getElementById('saron-table'), {
	defaultColAlign: 'left',
	minDimensions: [2, 26],
	allowInsertRow:true,
	allowManualInsertRow:true,
	allowInsertColumn:false,
	allowManualInsertColumn:false,
	allowDeleteRow:true,
	allowDeleteColumn:false,
	tableOverflow:true,
	columns: [
		{
			title: 'Date',
			name: 'Date',
			type: 'calendar',
			options: { format:'YYYY-MM-DD' },
			width:'120px',
		},
		{
			title: 'SARON Rate',
			name: 'SaronRate',
			type: 'numeric',
			//options: { format:'0.000000' },
			//mask:'0.000000',
			width:'120px',
			decimal:'.'
		},
	],
	onchange: cellChanged,   
	onload: ratesChanged,
	onpaste: ratesChanged,
	width: '300px',
	rowResize: false,
	columnDrag: false,
})

function cellChanged(instance, cell, x, y, value) {
	jexcel.current.ignoreEvents = true;
	if (x == 0) {
		const name = jexcel.getColumnNameFromId([y, x]);
		const newValue = value.substring(0, Math.min(10, value.length))
		jexcel.current.setValue(name, newValue)
	}
	jexcel.current.ignoreEvents = false
	ratesChanged(instance)
}

async function postJson(url, requestData) {
	try {
		const response = await fetch(url, { 
			body: requestData, 
			method: "POST",
			headers: { 'Content-Type': 'application/json' }
		})
		const data = await response.text()
		if(response.status != 200) throw data;
		return data
	} catch (e) {
		console.log('error', e)
		messageDialog("Error sending request:\n"+e)
		return null
	}
}

function exportChooserChanged(val) {
	const value = val.getValue()
	console.log(value)
	if(value === 'custom') {
		customParameters.style.display = "inline-block"
	} else {
		customParameters.style.display = "none"
		const isoDates = value.split(" ")
		startDate.value = isoDates[0]
		endDate.value = isoDates[1]
	}
}

function messageDialog(content) {
	serverText.innerText = ""
	if(content.trim().startsWith('<'))  {
		content = content.replace(/<[^>]+>/g, '')
			.replace(/^\s*$(?:\r\n?|\n)/gm,'')

		const newLineExpression = /\r\n|\n\r|\n|\r/g;
		const removeDuplicatedLines = (text) => {
			return text.split(newLineExpression)
				.filter((item, index, array) => array.indexOf(item) === index)
				.join('\n')
		};
		content = removeDuplicatedLines(content)
	}
	serverText.innerText = content
	serverMessage.modal.open()
}

function storeResults(data) {
	try {
		let csv = loadRates(data)
		csv.sort((a, b) => -a.Date.localeCompare(b.Date))
		saronTable.setData(csv)
		Spinner.close()
	} catch(err) {
		Spinner.close()
		messageDialog("Error occurred processing the imported rates file:\n"+err)        
	}
}

async function exportFile() {
	Spinner.open()
	console.time('Execution Time')
	setTimeout(function() {
		exportFile0()
	}, 100)
}

async function exportFile0() {
	function handleError(err) {
		console.trace(err)
		Spinner.close()
		messageDialog("Error occurred creating the file to export:\n"+err)
	}

	try {
		const request = {
			all: true,
			rational: false,
			allStartDates: allStartDates.checked,
			startDate: startDate.value,
			endDate: endDate.value,
			rates: d3.csvFormatBody(saronTable.getData())
		}
		
		function processResponse(response, parse) {
			let procData = null
			if(response != null && parse) {
				//console.log(response)
				procData = JSON.parse(response)
			} else if(response != null) {
				procData = response
				//console.log(JSON.stringify(procData).replaceAll(",{","\n,{"))
			}

			if(procData != null) {
				const result = d3.csvFormat(procData)
				let mimetype = "text/csv"
				const timeStamp = new Date().toISOString().substring(0,16).replaceAll(/[:.-]/g, '_').replace('T', '-');
				const dlLink = document.createElement('a')
				dlLink.href = 'data:'+mimetype+';charset=utf-8,' + encodeURI(result)
				dlLink.target = '_blank'
				dlLink.download = 'saron-compound-'+startdate.value+'_'+endDate.value+'_'+ timeStamp +'.csv'
				dlLink.click()
				dlLink.remove()
			}

			console.timeEnd('Execution Time')
			Spinner.close()
		}

		if(window.location.host.indexOf("mike-seger.github.io")>=0 || offline.checked) {
			const data = saronTable.getData()
			data.splice(0, 0, ["Date", "SaronRate"]);
			const csv = loadRates(d3.csvFormatBody(data))
			const rateMap = fillRates(csv)

			function handleReponse(e) {
				try {
					if(e.data.type === 'saronCalculator') {
						if(! e.data.error)
							processResponse(e.data.procData, e.data.parse)
						else handleError(e.data.error)
					} else handleError("Invalid worker response: "+e.data)
				} catch(err) { handleError("Unexpected error occurred: "+err) }
				saronCalculator.terminate()
				saronCalculator = null
			}

			if(saronCalculator == null) {
				saronCalculator = new Worker('./js/SaronCompoundCalculator.mjs', { type: "module" })
				saronCalculator.addEventListener("message", handleReponse, false)
				saronCalculator.postMessage({
					rateMap: rateMap, 
					startDate: startDate.value,
					endDate: endDate.value,
					all: request.all, 
					allStartDates: request.allStartDates
				})
			} else throw ("Error starting a second SaronCalculator")
		} else {
			postJson("api/v1", JSON.stringify(request))
				.then((procData) => processResponse(procData, true))
				.catch((err) => handleError(err))
			}
	} catch(err) { handleError(err) }
}

function importFile0(file) {
	if( !(
			file.type === "text/tab-separated-values"
			|| file.type === "text/csv"
			|| file.type === "text/plain"
		)) {
		messageDialog("Unsupported file type: "+file.type)
		return
	}

	const reader = new FileReader();
	reader.readAsText(file);
	reader.onload = () => storeResults(reader.result)
}

async function importFile() {
	const mode = importChooser.getValue()
	if(mode.trim() === "") return
	Spinner.open()
	importChooser.setValue("")
	if(mode === "SaronRatesUpload") {
		importFileDialog()
	} else if(mode.startsWith("Local ")) {
		const file = mode.substring("Local ".length)
		const data = await importResource("./data/"+file)
		storeResults(data)
	}
}

async function importResource(location) {
	try {
		const response = await fetch(location)
		if(response.status != 200) {
			Spinner.close()
			throw (`Received ${response.status} status from server while loading ${location}`)
		}
		const data = await response.text()
		return data
	} catch (e) {
		console.log('error', e)
		Spinner.close()
		messageDialog("Error loading resource:\n"+e)
		throw("Error loading resource:\n"+e)
	}
}

function importFileDialog() {
	Spinner.open()
	let input = document.createElement('input')
	let exporting = false
	input.type = 'file'
	input.accept = ".csv, .tsv, .txt"
	input.onchange = function(event) {
		exporting = true
		importFile0(input.files[0])
	}

	function addDialogClosedListener(input, callback) {
		let id = null
		let active = false
		let wrapper = function() { if (active) { active = false; callback() } }
		let cleanup = function() { clearTimeout(id) }
		let shedule = function(delay) { id = setTimeout(wrapper, delay) }
		let onFocus = function() { cleanup(); shedule(1000) }
		let onBlur = function() { cleanup() }
		let onClick = function() { cleanup(); active = true}
		let onChange = function() { cleanup(); shedule(0) }
		input.addEventListener('click', onClick)
		input.addEventListener('change', onChange)
		window.addEventListener('focus', onFocus)
		window.addEventListener('blur', onBlur)
		return function() {
			input.removeEventListener('click', onClick)
			input.removeEventListener('change', onChange)
			window.removeEventListener('focus', onFocus)
			window.removeEventListener('blur', onBlur)
		}
	}

	addDialogClosedListener(input, function() {
		if(!exporting) Spinner.close()
		console.log('File dialog closed!')
	})

	input.click()
}

//importButton.addEventListener('click', importFile)
exportButton.addEventListener('click', exportFile)
saronInfo.addEventListener('click', function (e) {
	saronInfoMessage.modal.open()
	const box = saronInfoMessage.querySelector("div")
	box.style.position = "absolute";
	const x = e.clientX + 15 + box.clientWidth/2;
	const y = e.clientY + 15 + box.clientHeight/2;
	box.style.left = `${x}px`;
	box.style.top = `${y}px`;
})

initParameters()
