import { loadRates, fillRates, compoundRates } from './js/saronCompoundCalculator.mjs'
import { plusDays, getPrevPeriod } from './js/dateUtils.mjs'
import { Loader } from './js/loader.mjs'

const serverMessage = document.querySelector('jsuites-modal')
const serverText = document.getElementById('servertext')
const startDate = document.getElementById('startdate')
const endDate = document.getElementById('enddate')
const allStartDates = document.getElementById('allStartDates')
const offline = document.getElementById('offline')
const offlineParameter = document.getElementById('offline-parameter')
const upload = document.getElementById('upload')
const download = document.getElementById('download')

const downloadParameters = document.getElementById('download-parameters')
const customParameters = document.getElementById('custom-parameters')
let maxDate = new Date()
let chooserData = createChooserData()

jSuites.calendar(startDate,{ format: 'YYYY-MM-DD' })
jSuites.calendar(endDate,{ format: 'YYYY-MM-DD' })
const downloadChooser = jSuites.dropdown(document.getElementById('download-chooser'), {
    data: chooserData,
    onchange: function(el,val) { downloadChooserChanged(val); },
    autocomplete: true,
})

function createChooserData() {
    let date = maxDate
    date.setDate(date.getDate() + 1)
    const prevQuarter = getPrevPeriod(date, 3)
    const prevSemester = getPrevPeriod(date, 6)
    const prevYear = getPrevPeriod(date, 12)
    const semQuarter = (prevSemester.n-1)*2
    const data = [
        { group:'Predefined Ranges', value: `${prevQuarter.start} ${prevQuarter.end}`, text: `Q${prevQuarter.n} '${prevQuarter.year99} (${prevQuarter.sMonth}-${prevQuarter.eMonth})` },
        { group:'Predefined Ranges', value: `${prevSemester.start} ${prevSemester.end}`, text: `Q${semQuarter}+Q${semQuarter+1} '${prevSemester.year99} (${prevSemester.sMonth}-${prevSemester.eMonth})` },
        { group:'Predefined Ranges', value: `${prevYear.start} ${prevYear.end}`, text: `${prevYear.year} (${prevYear.sMonth}-${prevYear.eMonth})` },
        { group:'Custom Range', value:'custom', text:'Range...' },
    ]

    return data
}

function initParameters() {
    downloadChooser.setValue(chooserData[0].value)
    offline.checked = true
    allStartDates.checked = true
    if(window.location.host.indexOf("mike-seger.github.io")>=0) {
        offlineParameter.style.display = "none"
    }
    downloadParameters.style.display = "none"
}

function ratesChanged(instance) {
    console.log("Rates changed")
    const data = instance.jexcel.getData()
    const validData = data
        .filter(rate => rate.length == 2)
        .filter(rate => rate[0].match(/^[12]...-..-...*/))
    if(validData.length>0) {
        const dates = validData.map(rate => rate[0])
        dates.sort()
        maxDate = new Date(dates[dates.length-1].substring(0,10))
        chooserData = createChooserData()
        downloadChooser.setData(chooserData)
        downloadChooserChanged(downloadChooser)
        downloadChooser.setValue(chooserData[0].value)
        downloadParameters.style.display = "block"
    } else {
        downloadParameters.style.display = "none"
    }
    console.log("Data: "+validData)
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
    onchange: ratesChanged,
    onload: ratesChanged,
    onpaste: ratesChanged,
    width: '300px',
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

function downloadChooserChanged(val) {
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
    try {
        console.log(data)
        let csv = null
        if(data.startsWith("ISIN;CH0049613687;")) {
            csv = data.replace(/^ISIN;CH0049613687;.*$/mg, "")
                .replace(/^SYMBOL;SARON;;.*$/mg, "")
                .replace(/^NAME;Swiss.*$/mg, "")
                .trim()
            if(! csv.startsWith("Date;Close;")) {
                Loader.close()
                messageDialog("Expected Date;Close;... in SIX SARON CSV")
                return    
            }
            csv = csv.replace(/Date;Close;/mg, "Date;SaronRate;")
                .replace(/; */mg, ",")
                .replace(/^([^,]*),([^,]*),.*/mg, "$1,$2")
                .replace(/^(..)\.(..)\.([12]...)/mg, "$3-$2-$1")
            csv = d3.csvParse(csv)
            if(csv.length < 365) {
                Loader.close()
                messageDialog("Expected more that 365 rows in SIX SARON CSV")
                return                
            }
            saronTable.setData(csv)
        } else {
            if(data.indexOf("\n")<0) throw ("Expected '\\n' linefeeds in data")
            if(data.indexOf(";")<0 && data.indexOf(",")<0 
                && data.indexOf("\t")<0) throw ("Expected column separators ';,\\t' in data")
            data = data.replace(";", "\t").replace(",", "\t").trim()
            const header = data.substring(0, Math.max(0,data.indexOf("\n"))).trim()
            if(!header.match(/[12][0-9]{3}-[0-9]{2}-[0-9]{2}.*/))
                data = data.substring(Math.max(0,data.indexOf("\n"))).trim()
            data = "Date\tSaronRate\n"+data
            let sample = data.substring(Math.max(0, data.indexOf("\n"))).trim()
            sample = sample.substring(0, Math.max(0,sample.indexOf("\n"))).trim()
            if(!sample.match(/^[12][0-9]{3}-[0-9]{2}-[0-9]{2}.-*[0-9]+\.[0-9]{6}$/))
                throw (`Data sanple (${sample}) doesn't match the expected format`)
            csv = d3.tsvParse(data)
            saronTable.setData(csv)
        }
        Loader.close()
    } catch(err) {
        Loader.close()
        messageDialog("Error occurred processing the uploaded rates file:\n"+err)        
    }
}

async function exportFile() {
    Loader.open()
    console.time('Execution Time')
    setTimeout(function() {
        exportFile0()
    }, 100);
}

async function exportFile0() {
    try {
        const request = {
            all: true,
            rational: false,
            allStartDates: allStartDates.checked,
            startDate: startDate.value,
            endDate: endDate.value,
            rates: d3.csvFormatBody(saronTable.getData())
        }

        function handleError(err) {
            console.error(err)
            Loader.close()
            messageDialog("Error occurred creating the file to download:\n"+err)
        }
        
        function processResponse(response, parse) {
            let procData = null
            if(response != null && parse) {
                console.log(response)
                procData = JSON.parse(response)
            } else if(response != null) {
                procData = response
                console.log(JSON.stringify(procData).replaceAll(",{","\n,{"))
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

            console.timeEnd('Execution Time')
            Loader.close()
        }

        if(window.location.host.indexOf("mike-seger.github.io")>=0 || offline.checked) {
            const data = saronTable.getData()
            data.splice(0, 0, ["Date", "SaronRate"]);
            const csv = loadRates(d3.csvFormatBody(data))
            const rateMap = fillRates(csv)
            compoundRates(rateMap, startDate.value, 
                endDate.value, request.all, request.allStartDates)
                .then((procData) => processResponse(procData, false))
                .catch((err) => handleError(err))
        } else {
            postJson("api/v1", JSON.stringify(request))
                .then((procData) => processResponse(procData, true))
                .catch((err) => handleError(err))
            }
    } catch(err) { handleError(err) }
}

function importFile() {
    Loader.open()
    let input = document.createElement('input')
    let uploading = false
    input.type = 'file'
    input.accept = ".csv, .tsv, .txt"
    input.onchange = function(event) {
        uploading = true
        uploadFile(input.files[0])
    }
    // input.onblur = function(event) {
    //     if(input.files.length) return true
    //     Loader.close()
    // }

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
        if(!uploading) Loader.close()
        console.log('File dialog closed!')
    })

    input.click()
}

upload.addEventListener('click', importFile)
download.addEventListener('click', exportFile)

initParameters()