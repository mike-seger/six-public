import { loadRates, fillRates } from './SaronRateLoader.mjs'
import { DateUtils as DU } from './utils/DateUtils.mjs'
import { RateGraph } from './RateGraph.mjs'
import { NumberUtils } from './utils/NumberUtils.mjs'
import { Spinner } from './utils/ui/Spinner.mjs'
import { EditorHistory as EH } from './EditorHistory.mjs'
import { JSpreadSheetHelper } from './utils/ui/JSpreadSheetHelper.mjs'
import { FileDropper } from './utils/ui/FileDropper.mjs'
import { ExportChooser } from './ExportChooser.mjs'
import { SaronCompoundDownloader } from './SaronCompoundDownloader.mjs'
import { stripHtmlTags } from './utils/HtmlUtils.mjs'

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
const removeButton = document.getElementById('removeEntry')
const exportButton = document.getElementById('export')
const saronTableElement = document.getElementById('saron-table')

const exportParameters = document.getElementById('export-parameters')
const customParameters = document.getElementById('custom-parameters')

let maxDate = new Date()
let minDate = maxDate
let saronTableTitle = "custom"
let exportChooser = new ExportChooser('export-chooser', exportChooserChanged)

const importChooser = jSuites.dropdown(document.getElementById('import-chooser'), {
	data: [
		{ value: "SaronRatesUpload", text: "File..." },
		{ value: "empty", text: "Empty" },
		{ value: "Local saron-2022.tsv", text: "2022" },
		{ value: "Local saron-2021.tsv", text: "2021" },
		{ value: "Local saron-2020.tsv", text: "2020" },
		{ value: "Local saron-2019.tsv", text: "2019" },
	],
	onchange: importFile,
	width: '100px'
})

const editorHistoryChooser = jSuites.dropdown(document.getElementById('editor-history-chooser'), {
	data: [],
	onchange: importDirect,
	width: '250px'
})

function updateEditorHistoryChooserData(metaKey) {
	const data = new Array()
	EH.getHistoryMetaData().map(item =>
		data.push({ group: item.title, value: item.metaKey, text: item.dateTime }))
	editorHistoryChooser.setData(data)
	if(metaKey) editorHistoryChooser.setValue(metaKey)
}

jSuites.calendar(startDate,{ format: 'YYYY-MM-DD' })
jSuites.calendar(endDate,{ format: 'YYYY-MM-DD' })

function initParameters() {
	importChooser.setValue("")
	updateEditorHistoryChooserData()
	offline.checked = true
	allStartDates.checked = true
	if(window.location.host.indexOf("mike-seger.github.io")>=0) {
		offlineParameter.style.display = "none"
	}
	exportParameters.style.display = "none"
}

function ratesChanged(instance) {
	//console.log("Rates changed")
	const jexcel = instance.jexcel?instance.jexcel:instance
	const data = jexcel.getData()

	setTimeout(function() {
		RateGraph.update(data)
	}, 100)

	const validData = data
		.filter(rate => rate.length == 2)
		.filter(rate => rate[0].match(/^[12]...-..-...*/))
	if(validData.length>0) {
		const dates = validData.map(rate => rate[0])
		dates.sort()
		minDate = dates[0].substring(0,10)
		maxDate = DU.plusDays(new Date(dates[dates.length-1].substring(0,10)), 1)
		exportChooser.change(minDate, maxDate)
		//exportChooserChanged(exportChooser)

		exportParameters.style.display = "block"
	} else {
		exportParameters.style.display = "none"
	}
}

const saronTable = jspreadsheet(saronTableElement, {
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
			width:'120px',
			decimal:'.'
		},
	],
	//onevent: tableEvent,
	onafterchanges: onAfterChanges,
	onchange: cellChanged,
	oninsertrow: rowInserted,
	ondeleterow: deleteRows,
	onload: ratesChanged,
	onpaste: tableChanged,
	onundo: tableChanged,
	onredo: tableChanged,
	onselection: cellsSelected,
	contextMenu: function(obj, x, y, e, items, section) {
		var items = []

		if (obj.options.allowInsertRow == true) {
			items.push({
				title: T('Insert new rows'),
				onclick: function() {
					let numOfRows = 1
					let rowNum = parseInt(y)
					let selectedRows = obj.getSelectedRows(true)
					if(selectedRows) {
						numOfRows = selectedRows.length
						rowNum = Math.min.apply(Math, selectedRows)
					}
					obj.insertRow(numOfRows, rowNum, 1)
				}
			})
		}
	
		if (obj.options.allowDeleteRow == true) {
			items.push({
				title: T('Delete selected rows'),
				onclick: function() {
					obj.deleteRow(obj.getSelectedRows().length ? undefined : parseInt(y))
				}
			})
		}
		
		return items
	},
	width: '300px',
	rowResize: false,
	columnDrag: false,
})

function deleteRows(a,b,c,d,e) {
	tableChanged()
}

function tableChanged() {
	const itemInfo = EH.addItemToHistory(saronTableTitle, getValidTableDataAsJson())
	updateEditorHistoryChooserData(itemInfo.metaKey)
	ratesChanged(saronTable)
}

function rowInserted(instance, rowNumber, numOfRows, insertBefore) {
	jexcel.current.ignoreEvents = true

	console.log(instance, jexcel.current.options.data.length, rowNumber, numOfRows, insertBefore)
	let lastRow = jexcel.current.options.data.length-1
	let srcRow = rowNumber+numOfRows
	const prevWorkingDate = DU.plusSwissWorkingDays(DU.isoDate(new Date()), -1)
	let srcDate = srcRow<=lastRow?jexcel.current.getRowData(srcRow)[0]:prevWorkingDate
	if(!srcDate.match(/^[12]...-..-..$/)) srcDate  = prevWorkingDate
	console.log("srcDate = "+srcDate)
	let newDate = srcDate
	for(let j=numOfRows-1;j>=0;j--) {
		newDate = DU.plusSwissWorkingDays(newDate, 1)
		jexcel.current.setRowData(rowNumber+j, [newDate, ""])
	}

	jexcel.current.ignoreEvents = false
}

function cellsSelected(el, px, py, ux, uy, origin) {
	if(py === uy) {
		const isoDate = jexcel.current.getValueFromCoords(0, py)
		RateGraph.annotatePoint(isoDate)
	}
}

function onAfterChanges(instance, cells) {
	cells.map(cell => cellChanged(instance, cell, cell.x, cell.y, cell.newValue))
	tableChanged()
}

function cellChanged(instance, cell, x, y, value) {
	if(value) {
		jexcel.current.ignoreEvents = true
		const name = jexcel.getColumnNameFromId([x,y])
		value = (value+"").replace(/[^\d.-]/gm, "")
		if (x==0 && value.match(/^[12]...-..-...*/)) {
			jexcel.current.setValue(name, value.substring(0,10))
			rowChanged(jexcel.current.getRowData(y))
		} else if(x==1) {
			if(value.startsWith(".") || value.startsWith("-."))
				value = value.replace(".", "0.")
			if(value.match(/^-*(\d+)(,\d{0,}|\.\d{1,})?$/)) {
				jexcel.current.setValue(name, NumberUtils.formattedRound(Number(value), 6))
				rowChanged(jexcel.current.getRowData(y))
			}
		} else {
			console.log(`Invalid value at (${x}/${y}) ${value}`)
			value = ""
		}
		tableChanged()
		//ratesChanged(instance)
		jexcel.current.ignoreEvents = false
	}
}

function getValidTableDataAsJson() {
	const data = saronTable.getData().filter(e => 
		e[0].match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
		//&& e[1].match(/^-*[0-9.]+$/)
	)
	return JSON.stringify(data)
}

function rowChanged(rowData) {
	if(rowData.indexOf("")<0) tableChanged()
}

async function postJson(url, requestData) {
	try {
		const response = await fetch(url, { 
			body: requestData, 
			method: "POST",
			headers: { 'Content-Type': 'application/json' }
		})
		const data = await response.text()
		if(response.status != 200) throw data
		return data
	} catch (e) {
		console.log('error', e)
		messageDialog(`Error sending request to ${url}:\n${stripHtmlTags(e.trim())}`)
		return null
	}
}

function exportChooserChanged(val) {
	const value = val.getValue()
	//console.log(value)
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

		const newLineExpression = /\r\n|\n\r|\n|\r/g
		const removeDuplicatedLines = (text) => {
			return text.split(newLineExpression)
				.filter((item, index, array) => array.indexOf(item) === index)
				.join('\n')
		}
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
		downloadSaronCompoundFile()
	}, 100)
}

async function downloadSaronCompoundFile() {
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
		
		if(window.location.host.indexOf("mike-seger.github.io")>=0 || offline.checked) {
			const data = saronTable.getData()
			data.splice(0, 0, ["Date", "SaronRate"])
			const csv = loadRates(d3.csvFormatBody(data))
			const rateMap = fillRates(csv)

			function handleReponse(e) {
				try {
					if(e.data.type === 'saronCalculator') {
						if(! e.data.error)
							SaronCompoundDownloader.download(e.data.procData, e.data.parse)
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
				.then((procData) => SaronCompoundDownloader.download(procData, true))
				.catch((err) => handleError(err))
			}
	} catch(err) { handleError(err) }
}

function removeCurrentHistoryEntry() {
	const metaKey = editorHistoryChooser.getValue()
	if(metaKey && metaKey !== "") {
		const nextItem = EH.removeItem(metaKey)
		updateEditorHistoryChooserData()
		if(nextItem) editorHistoryChooser.setValue(nextItem.metaKey)
	}
}

function readSaronFile(file) {
	if( !(
			file.type === "text/tab-separated-values"
			|| file.type === "text/csv"
			|| file.type === "text/plain"
		)) {
		messageDialog("Unsupported file type: "+file.type)
		return
	}

	try {
		const reader = new FileReader()
		reader.readAsText(file)
		reader.onload = () => {
			editorHistoryChooser.setValue("")
			storeResults(reader.result)
			saronTableTitle = file.name
			tableChanged()
			Spinner.close()
		}
	} catch(error) {
		Spinner.close()
		messageDialog("Error loading file: "+error)
	}
}

function importDirect(data) {
	if(data.dropdown) {
		const metaKey = editorHistoryChooser.getValue()
		data = EH.getItemData(metaKey)
		saronTableTitle = EH.getItemInfo(metaKey).title
	} else saronTableTitle = "custom"
	saronTable.setData(JSON.parse(data))
}

async function importFile() {
	const mode = importChooser.getValue()
	if(mode.trim() === "") return
	if(mode === "empty") {
		importDirect(JSON.stringify([]))
		editorHistoryChooser.setValue("")
		return
	}
	Spinner.open()
	importChooser.setValue("")
	if(mode === "SaronRatesUpload") {
		FileDialog.open(".csv, .tsv, .txt", () => Spinner.close())
	} else if(mode.startsWith("Local ")) {
		const file = mode.substring("Local ".length)
		const data = await importResource("./data/"+file)
		editorHistoryChooser.setValue("")
		storeResults(data)
		saronTableTitle = file
		tableChanged()
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

removeButton.addEventListener('click', removeCurrentHistoryEntry)
exportButton.addEventListener('click', exportFile)
saronInfo.addEventListener('click', function (e) {
	saronInfoMessage.modal.open()
	const box = saronInfoMessage.querySelector("div")
	box.style.position = "absolute"
	const x = e.clientX + 15 + box.clientWidth/2
	const y = e.clientY + 15 + box.clientHeight/2
	box.style.left = `${x}px`
	box.style.top = `${y}px`
})

function keyListener(e) {
	if(e.key == 'PageDown' || e.key == 'PageUp') {
		JSpreadSheetHelper.pageUpDown(jexcel.current, e.key == 'PageUp')
	}
}

initParameters()
FileDropper.enableFileDrop("dropzone", "dragging", readSaronFile)
document.addEventListener("keydown", keyListener)
