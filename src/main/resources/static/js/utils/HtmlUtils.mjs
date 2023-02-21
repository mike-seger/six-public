function stripHtmlTags(text) {
    if(text.startsWith("<") && text.endsWith(">")) {
        var div = document.createElement("div")
        div.innerHTML = text
        text = div.innerText
            .replaceAll("\r", "")
            .replace(/^ */gm,'')
            .replace(/ *$/gm,'')
            .replaceAll("Error response", "")
            .trim()
        text = text.split("\n")
            .filter((item, i, allItems) => {
            return i === allItems.indexOf(item) })
            .join("\n")
    }
    return text
}

export { stripHtmlTags }