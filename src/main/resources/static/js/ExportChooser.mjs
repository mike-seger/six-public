import { DateUtils as DU } from './utils/DateUtils.mjs'

class ExportChooser {
    constructor(elementId, exportChooserChanged) {
        this.chooser = jSuites.dropdown(
            document.getElementById(elementId), { 
            data: null,
        onchange: function(el,val) { exportChooserChanged(val) }})
    }

    change(minDate, maxDate) {
        const data = createData(minDate, maxDate)
        this.chooser.setData(data)
        if(data.length>0)
            this.chooser.setValue(data[0].value)
    }
}

function createData(minDate, maxDate) {
	let date = maxDate
	const prevQuarter = DU.getPrevPeriod(date, 3)
	const prevSemester = DU.getPrevPeriod(date, 6)
	const prevYear = DU.getPrevPeriod(date, 12)
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

export { ExportChooser } 
