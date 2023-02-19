function addItemToHistory(title, data) {
    const isoDateTime = new Date().toISOString().substring(0,19).replace("T", " ")
    const metaKey = isoDateTime+'\t'+title
    localStorage.setItem(metaKey, data)
    return getItemInfo(metaKey)
}

function getHistoryMetaData() {
    const metaData = Array()
    for (let i = 0; i < localStorage.length; i++) {
        const metaKey = localStorage.key(i)
        const tok = metaKey.split("\t")
        metaData.push({ group: tok[1], metaKey: metaKey, dateTime: tok[0], title: tok[1] })
    }
    metaData.sort((a, b) => (a.metaKey > b.metaKey) ? -1 : ((b.metaKey > a.metaKey) ? 1 : 0))
    return metaData
}

function removeItem(metaKey) {
    const itemInfo = getItemInfo(metaKey)
    if(! itemInfo) return undefined
    const history = getHistoryMetaData()//.filter(item => item.group === itemInfo.group )
    let nextItem = history.find((item, index, arr) => index < arr.length-1 && 
        arr[index+1].metaKey === metaKey )
    nextItem = nextItem?nextItem : history.find((item, index, arr) => index > 0 && 
        arr[index-1].metaKey === metaKey )
    localStorage.removeItem(metaKey)
    return nextItem
}

function getItemData(metaKey) {
    return localStorage.getItem(metaKey)
}

function getItemInfo(metaKey) {
    const tok = metaKey.split("\t")
    return { metaKey: metaKey, dateTime: tok[0], title: tok[1] }
}

function getNewestItem() {
   const list = getHistoryMetaData()
   if(list.length === 0) return { metaKey: null }
   return list[0]
}

function getNewestItemData() {
    return getItemData(getNewestItem().metaKey)
}

let EditorHistory = {
    addItemToHistory: addItemToHistory,
    getItemData: getItemData,
    getItemInfo: getItemInfo,
    getNewestItem: getNewestItem,
    removeItem: removeItem,
    getNewestItemData: getNewestItemData,
    getHistoryMetaData: getHistoryMetaData,
}

export { EditorHistory }
