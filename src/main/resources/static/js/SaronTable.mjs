export class SaronTable {
    constructor(tableElementId, tableChanged, tableLoaded, dateSelected) {
        this.saronTableElement = document.getElementById(tableElementId)
        this.tableChanged = tableChanged
        this.tableLoaded = tableLoaded
        this.dateSelected = dateSelected
    }

    init() {
        const tableElement = this.saronTableElement
        const self = this

        function jexcelChanged(instance) {
            this.tableChanged(self)
        }
    
        function deleteRows(a,b,c,d,e) {
            this.jexcelChanged()
        }
    
        function rowInserted(instance, rowNumber, numOfRows, insertBefore) {
            tableElement.jexcel.ignoreEvents = true
    
            console.log(instance, jexcel.current.options.data.length, rowNumber, numOfRows, insertBefore)
            let lastRow = tableElement.jexcel.options.data.length-1
            let srcRow = rowNumber+numOfRows
            const prevWorkingDate = DU.plusSwissWorkingDays(DU.isoDate(new Date()), -1)
            let srcDate = srcRow<=lastRow?tableElement.jexcel.getRowData(srcRow)[0]:prevWorkingDate
            if(!srcDate.match(/^[12]...-..-..$/)) srcDate  = prevWorkingDate
            console.log("srcDate = "+srcDate)
            let newDate = srcDate
            for(let j=numOfRows-1;j>=0;j--) {
                newDate = DU.plusSwissWorkingDays(newDate, 1)
                tableElement.jexcel.setRowData(rowNumber+j, [newDate, ""])
            }
    
            tableElement.jexcel.ignoreEvents = false
        }
    
        function cellsSelected(el, px, py, ux, uy, origin) {
            if(py === uy) {
                const isoDate = el.jexcel.getValueFromCoords(0, py)
                self.dateSelected(isoDate)
            }
        }
    
        function onAfterChanges(instance, cells) {
            cells.map(cell => this.cellChanged(instance, cell, cell.x, cell.y, cell.newValue))
            this.tableChanged(self)
        }
    
        function cellChanged(el, cell, x, y, value) {
            if(value) {
                tableElement.jexcel.ignoreEvents = true
                const name = tableElement.jexcel.getColumnNameFromId([x,y])
                value = (value+"").replace(/[^\d.-]/gm, "")
                if (x==0 && value.match(/^[12]...-..-...*/)) {
                    tableElement.jexcel.setValue(name, value.substring(0,10))
                    this.rowChanged(tableElement.jexcel.getRowData(y))
                } else if(x==1) {
                    if(value.startsWith(".") || value.startsWith("-."))
                        value = value.replace(".", "0.")
                    if(value.match(/^-*(\d+)(,\d{0,}|\.\d{1,})?$/)) {
                        tableElement.jexcel.setValue(name, NumberUtils.formattedRound(Number(value), 6))
                        this.rowChanged(tableElement.jexcel.getRowData(y))
                    }
                } else {
                    console.log(`Invalid value at (${x}/${y}) ${value}`)
                    value = ""
                }
                this.tableChanged(self)
                //ratesChanged(instance)
                jexcel.current.ignoreEvents = false
            }
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

    setData(data) { return this.saronTableElement.jexcel.setData(data) }

    getData() { return this.saronTableElement.jexcel.getData() }
}