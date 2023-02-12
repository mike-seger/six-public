import { loadRates, fillRates, compoundRates } from './js/saronCompoundCalculator.mjs'
//import {csvFormat} from "https://cdn.skypack.dev/d3-dsv@3"

// https://www.six-group.com/exchanges/indices/data_centre/swiss_reference_rates/reference_rates_en.html
const saronTableDiv = document.getElementById('saron-table')
const serverMessage = document.querySelector('jsuites-modal')
const serverText = document.getElementById('servertext')
const startDate = document.getElementById('startdate')
const endDate = document.getElementById('enddate')
const allStartDates = document.getElementById('allStartDates')
const offline = document.getElementById('offline')
const upload = document.getElementById('upload')
const download = document.getElementById('download')

jSuites.calendar(startDate,{ format: 'YYYY-MM-DD' })
jSuites.calendar(endDate,{ format: 'YYYY-MM-DD' })

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
    rowResize: false,
    columnDrag: false,
});

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
        messageDialog("Error sending request: "+e.message)
        return null
    }
}

function getSaronTable() {
    if(!saronTableDiv.children[0]) return undefined;
    return saronTableDiv.jexcel[0];
}

function uploadFile(file) {
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
    reader.onload = () => storeResults(reader.result);
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
    console.log(data)
    let csv = null
    if(data.startsWith("ISIN;CH0049613687;")) {
        csv = data.replace(/^ISIN;CH0049613687;.*$/mg, "")
            .replace(/^SYMBOL;SARON;;.*$/mg, "")
            .replace(/^NAME;Swiss.*$/mg, "")
            .trim()
        if(! csv.startsWith("Date;Close;")) {
            messageDialog("Expected Date;Close;... in SIX SARON CSV")
            return    
        }
        csv = csv.replace(/Date;Close;/mg, "Date;SaronRate;")
            .replace(/; */mg, ",")
            .replace(/^([^,]*),([^,]*),.*/mg, "$1,$2")
            .replace(/^(..)\.(..)\.([12]...)/mg, "$3-$2-$1")
        csv = d3.csvParse(csv)
        if(csv.length < 365) {
            messageDialog("Expected more that 365 rows in SIX SARON CSV")
            return                
        }
        saronTable.setData(csv)
    }
}

async function exportFile() {
    const request = {
        all: true,
        rational: false,
        allStartDates: allStartDates.checked,
        startDate: startDate.value,
        endDate: endDate.value,
        rates: d3.csvFormatBody(saronTable.getData())
    }
    
    let procData = null
    if(window.location.host.indexOf("mike-seger.github.io")>=0 || offline.checked) {
        const data = saronTable.getData()
        data.splice(0, 0, ["Date", "SaronRate"]);
        const csv = loadRates(d3.csvFormatBody(data))
        const rateMap = fillRates(csv)
        procData = compoundRates(rateMap, startDate.value, 
            endDate.value, request.all, request.allStartDates)
        console.log(JSON.stringify(procData).replaceAll(",{","\n,{"))
    } else {
        const response = await postJson("api/v1", JSON.stringify(request))
        if(response != null) {
            console.log(response)
            procData = JSON.parse(response)
        }
    }
    if(procData != null) {
        const result = d3.csvFormat(procData)
        let mimetype = "text/csv"
        const timeStamp =new Date().toISOString().substring(0,16).replaceAll(/[:.-]/g, '_').replace('T', '-');
        const dlLink = document.createElement('a')
        dlLink.href = 'data:'+mimetype+';charset=utf-8,' + encodeURI(result)
        dlLink.target = '_blank'
        dlLink.download = 'saron-compound-'+startdate.value+'_'+endDate.value+'_'+ timeStamp +'.csv'
        dlLink.click()
        dlLink.remove()
    }
}

function importFile() {
    let input = document.createElement('input')
    input.type = 'file'
    input.accept = ".csv, .tsv, .txt"
    input.onchange = _this => {	uploadFile(input.files[0]);	}
    input.click()
}

upload.addEventListener('click', importFile)
download.addEventListener('click', exportFile)