export class SaronTable {
    constructor(tableElementId, ratesChanged) {
        const saronTableElement = document.getElementById(tableElementId)
        this.ratesChanged = ratesChanged
        this.saronTable = jspreadsheet(saronTableElement, {
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
            onafterchanges: this.onAfterChanges,
            onchange: this.cellChanged,
            oninsertrow: this.rowInserted,
            ondeleterow: this.deleteRows,
            onload: this.ratesChanged,
            onpaste: this.tableChanged,
            onundo: this.tableChanged,
            onredo: this.tableChanged,
            onselection: this.cellsSelected,
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
    }

    deleteRows(a,b,c,d,e) {
        tableChanged()
    }

    tableChanged() {
        const itemInfo = EH.addItemToHistory(saronTableTitle, getValidTableDataAsJson())
        updateEditorHistoryChooserData(itemInfo.metaKey)
        ratesChanged(saronTable)
    }

    rowInserted(instance, rowNumber, numOfRows, insertBefore) {
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

    cellsSelected(el, px, py, ux, uy, origin) {
        if(py === uy) {
            const isoDate = jexcel.current.getValueFromCoords(0, py)
            RateGraph.annotatePoint(isoDate)
        }
    }

    onAfterChanges(instance, cells) {
        cells.map(cell => cellChanged(instance, cell, cell.x, cell.y, cell.newValue))
        tableChanged()
    }

    cellChanged(instance, cell, x, y, value) {
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

    getValidTableDataAsJson() {
        const data = saronTable.getData().filter(e => 
            e[0].match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
            //&& e[1].match(/^-*[0-9.]+$/)
        )
        return JSON.stringify(data)
    }

    rowChanged(rowData) {
        if(rowData.indexOf("")<0) tableChanged()
    }

    getData() { return this.saronTable.getData() }
}