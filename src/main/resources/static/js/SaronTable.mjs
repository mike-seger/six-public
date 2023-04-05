import { NumberUtils } from './utils/NumberUtils.mjs'

export class SaronTable {
    constructor(tableElementId, tableChanged, tableLoaded, dateSelected) {
        this.saronTableElement = document.getElementById(tableElementId)
        this.tableChanged = tableChanged
        this.tableLoaded = tableLoaded
        this.dateSelected = dateSelected
        this.selectedColumn = 0
    }

    init() {
        const jexcel = this.saronTableElement.jexcel
        const self = this

        function jexcelChanged(instance) {
            self.tableChanged(self)
        }
    
        function deleteRows(a,b,c,d,e) {
            self.jexcelChanged()
        }
    
        function rowInserted(instance, rowNumber, numOfRows, insertBefore) {
            jexcel.ignoreEvents = true
    
            console.log(instance, jexcel.current.options.data.length, rowNumber, numOfRows, insertBefore)
            let lastRow = jexcel.options.data.length-1
            let srcRow = rowNumber+numOfRows
            const prevWorkingDate = DU.plusSwissWorkingDays(DU.isoDate(new Date()), -1)
            let srcDate = srcRow<=lastRow?jexcel.getRowData(srcRow)[0]:prevWorkingDate
            if(!srcDate.match(/^[12]...-..-..$/)) srcDate  = prevWorkingDate
            console.log("srcDate = "+srcDate)
            let newDate = srcDate
            for(let j=numOfRows-1;j>=0;j--) {
                newDate = DU.plusSwissWorkingDays(newDate, 1)
                jexcel.setRowData(rowNumber+j, [newDate, ""])
            }
    
            jexcel.ignoreEvents = false
        }
    
        function cellsSelected(el, px, py, ux, uy, origin) {
            if(py === uy) {
                const isoDate = el.jexcel.getValueFromCoords(0, py)
                self.dateSelected(isoDate)
            } else if(py == 0 && px === ux) {
                const length = self.saronTableElement.jexcel.getData().length
                if(uy + 1 == length) self.selectedColumn = px
            }
        }
    
        function onAfterChanges(instance, cells) {
            //cells.map(cell => self.cellChanged(instance, cell, cell.x, cell.y, cell.newValue))
            self.tableChanged(self)
        }
    
        function cellChanged(el, cell, x, y, value) {
            if(value && el.jexcel) {
                const jexcel = el.jexcel
                jexcel.ignoreEvents = true
                const name = jspreadsheet.helpers.getColumnNameFromCoords(x,y)
                value = (value+"").replace(/[^\d.-]/gm, "")
                if (x==0 && value.match(/^[12]...-..-...*/)) {
                    jexcel.setValue(name, value.substring(0,10))
                    self.rowChanged(jexcel.getRowData(y))
                } else if(x==1) {
                    if(value.startsWith(".") || value.startsWith("-."))
                        value = value.replace(".", "0.")
                    if(value.match(/^-*(\d+)(,\d{0,}|\.\d{1,})?$/)) {
                        jexcel.setValue(name, NumberUtils.formattedRound(Number(value), 6))
                        self.rowChanged(jexcel.getRowData(y))
                    }
                } else {
                    console.log(`Invalid value at (${x}/${y}) ${value}`)
                    value = ""
                }
               // this.tableChanged(self)
                //ratesChanged(instance)
                jexcel.ignoreEvents = false
            }
        }

        function sort(direction) {
            return function(a, b) {
                let valueA = a[1]
                let valueB = b[1]
                if(self.selectedColumn === 1) {
                    valueA = valueA === ''? '' : Number(valueA)
                    valueB = valueB === ''? '' : Number(valueB)
                }
                let result = (valueA === '' && valueB !== '') ?
                    1 : (valueA !== '' && valueB === '') ?
                        -1 : (valueA > valueB) ?
                            1 : (valueA < valueB) ?
                                -1 : 0
                if (! direction) return result
                else return -result
            }
        }

        function contextMenu(obj, x, y, e, items, section) {
            let newItems = []

            if (obj.options.allowInsertRow == true) {
                newItems.push({
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
                newItems.push({
                    title: T('Delete selected rows'),
                    onclick: function() {
                        obj.deleteRow(obj.getSelectedRows().length ? undefined : parseInt(y))
                    }
                })
            }

            return newItems
        }

        this.saronTable = jspreadsheet(this.saronTableElement, {
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
            onload: self.tableLoaded,
            onpaste: jexcelChanged,
            onundo: jexcelChanged,
            onredo: jexcelChanged,
            onselection: cellsSelected,
            contextMenu: contextMenu,
            sorting: sort,
            width: '300px',
            rowResize: false,
            columnDrag: false,
        })

        return this
    }

    getValidTableDataAsJson() {
        const data = this.saronTableElement.jexcel.getData().filter(e => 
            e[0].match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
            //&& e[1].match(/^-*[0-9.]+$/)
        )
        return JSON.stringify(data)
    }

    rowChanged(rowData) {
        if(rowData.indexOf("")<0) this.tableChanged(this)
    }

    simulateKey() {

    }
    
    setData(data) { return this.saronTableElement.jexcel.setData(data) }

    getData() { return this.saronTableElement.jexcel.getData() }
}