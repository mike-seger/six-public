import { loadRates, fillRates } from './SaronRateLoader.mjs'
import { DateUtils as DU } from './utils/DateUtils.mjs'
import { RateGraph } from './RateGraph.mjs'
import { Spinner } from './utils/ui/Spinner.mjs'
import { EditorHistory as EH } from './EditorHistory.mjs'
import { JSpreadSheetHelper } from './utils/ui/JSpreadSheetHelper.mjs'
import { FileDialog } from './utils/ui/FileDialog.mjs'
import { FileDropper } from './utils/ui/FileDropper.mjs'
import { ExportChooser } from './ExportChooser.mjs'
import { SaronCompoundDownloader } from './SaronCompoundDownloader.mjs'
import { SaronTable } from './SaronTable.mjs'
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

const exportParameters = document.getElementById('export-parameters')
const customParameters = document.getElementById('custom-parameters')

let saronTableTitle = "custom"
const saronTable = new SaronTable('saron-table', 
	tableChanged, ratesChanged, dateSelected).init()

let maxDate = new Date()
let minDate = maxDate
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

function initInputs() {
	importChooser.setValue("")
	updateEditorHistoryChooserData()
	offline.checked = true
	allStartDates.checked = true
	if(window.location.host.indexOf("mike-seger.github.io")>=0) {
		offlineParameter.style.display = "none"
	}
	exportParameters.style.display = "none"
}

function tableChanged(saronTable) {
	const itemInfo = EH.addItemToHistory(saronTableTitle, 
		saronTable.getValidTableDataAsJson())
	updateEditorHistoryChooserData(itemInfo.metaKey)
	ratesChanged(saronTable.saronTableElement)
}

function dateSelected(isoDate) {
	RateGraph.annotatePoint(isoDate)
}

function ratesChanged(saronTable) {
	//console.log("Rates changed")
	//const jexcel = instance.jexcel?instance.jexcel:instance
	const data = saronTable.jexcel.getData()

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

function pointClicked(x, y) {
	JSpreadSheetHelper.scrollToFirstRow(saronTable.saronTableElement, [x,y])
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
			tableChanged(saronTable)
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
	if(saronTable) saronTable.setData(JSON.parse(data))
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
		new FileDialog().open(".csv, .tsv, .txt", (file) => readSaronFile(file), () => Spinner.close())
	} else if(mode.startsWith("Local ")) {
		const file = mode.substring("Local ".length)
		const data = await importResource("./data/"+file)
		editorHistoryChooser.setValue("")
		storeResults(data)
		saronTableTitle = file
		tableChanged(saronTable)
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
document.addEventListener("keydown", function keyListener(e) {
	if(e.key == 'PageDown' || e.key == 'PageUp') {
		JSpreadSheetHelper.pageUpDown(jexcel.current, e.key == 'PageUp')
	}
})

initInputs()
FileDropper.enableFileDrop("dropzone", "dragging", readSaronFile)
RateGraph.setPointClickCallback(pointClicked)
RateGraph.addKeyListener((e) =>{
	if(e.key == 'PageDown' || e.key == 'PageUp' 
		|| e.key == 'ArrowUp' || e.key == 'ArrowDown') {
			saronTable.saronTableElement.focus()
			if(e.key == 'PageDown' || e.key == 'PageUp')
				JSpreadSheetHelper.pageUpDown(jexcel.current, e.key == 'PageUp')
			else
				saronTable.saronTableElement.dispatchEvent(
					new KeyboardEvent('keydown', {'key': e.key}));
		return false
	}
})
