export class SaronCompoundDownloader {
    download(rawData, parse) {
        let procData = null
        if(rawData != null && parse) {
            //console.log(response)
            procData = JSON.parse(rawData)
        } else if(rawData != null) {
            procData = rawData
            //console.log(JSON.stringify(procData).replaceAll(",{","\n,{"))
        }

        if(procData != null) {
            const result = d3.csvFormat(procData)
            let mimetype = "text/csv"
            const timeStamp = new Date().toISOString().substring(0,16).replaceAll(/[:.-]/g, '_').replace('T', '-')
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
}
