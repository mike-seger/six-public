function addItemToHistory(title, data) {
    const isoDateTime = new Date().toISOString().substring(0,19).replace("T", " ")
    const metaKey = isoDateTime+'\t'+title
    localStorage.setItem(metaKey, data)
}

function getHistoryMetaData() {
    const metaData = Array()
    for (let i = 0; i < localStorage.length; i++) {
        const metaKey = localStorage.key(i)
        const tok = metaKey.split("\t")
        metaData.push({ metaKey: metaKey, dateTime: tok[0], title: tok[1] })
    }
    metaData.sort((a, b) => (a.metaKey > b.metaKey) ? -1 : ((b.metaKey > a.metaKey) ? 1 : 0))
    return metaData
}

function removeItem(metaKey) {
    return localStorage.removeItem(metaKey)
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

export { addItemToHistory, getItemData, getItemInfo, getNewestItem, removeItem, getNewestItemData, getHistoryMetaData }
