function isVisible(ele, container, partial, dTop, dBottom) {
	const eleTop = ele.offsetTop
	const eleBottom = eleTop + ele.clientHeight

	const containerTop = container.scrollTop + dTop
	const containerBottom = containerTop + container.clientHeight + dBottom - dTop

	// The element is fully visible in the container
	return (
		(eleTop >= containerTop && eleBottom <= containerBottom) ||
		// Some part of the element is visible in the container
		(partial && 
			(
				(eleTop < containerTop && containerTop < eleBottom) ||
				(eleTop < containerBottom && containerBottom < eleBottom)
			)
		)
	)
}

function findFirstVisibleRowIndex(rows, container, partially, dTop, dBottom) {
	for (var i = 0; i < rows.length; i++)
		if(isVisible(rows[i], container, partially, dTop, dBottom)) return i
	return 0
}

function findLastVisibleRowIndex(rows, container, partially, dTop, dBottom) {
	for (var i = rows.length-1; i >=0; i--)
		if(isVisible(rows[i], container, partially, dTop, dBottom)) return i
	return rows.length-1
}

function pageUpDown(js, up) {
	const content = js.el.querySelector('.jexcel_content')
	const tbody = js.el.querySelector('tbody.draggable')
	const allTrs = tbody.querySelectorAll("tr")
	const dTop = allTrs.length<=0?0:allTrs[0].offsetTop
	const dBottom = 1

	let x = 1
	let y = 0
	if(js.highlighted && js.highlighted.length>0) {
		x = Number(js.highlighted[0].getAttribute('data-x'))
		y = Number(js.highlighted[0].getAttribute('data-y'))
	} else {
		y = findFirstVisibleRowIndex(allTrs, content, false, dTop, dBottom)
	}

	const firstPartialRowIndex = findFirstVisibleRowIndex(allTrs, content, true, dTop, dBottom)
	if(y<firstPartialRowIndex) y = firstPartialRowIndex

	// const firstFullRowIndex = findFirstVisibleRowIndex(allTrs, content, false, dTop, dBottom)
	// const lastFullRowIndex = findLastVisibleRowIndex(allTrs, content, false, dTop, dBottom)

	let firstRowIndex 
	if(up) {
			firstRowIndex = findFirstVisibleRowIndex(allTrs, content, false, dTop, dBottom)
			content.scrollTop = allTrs[firstRowIndex].offsetTop - content.offsetHeight
			firstRowIndex = findFirstVisibleRowIndex(allTrs, content, false, dTop, dBottom)
	} else {
			let lastRowIndex = findLastVisibleRowIndex(allTrs, content, true, dTop, dBottom)
			content.scrollTop = allTrs[lastRowIndex].offsetTop - dTop
			let updatedLastRowIndex = findLastVisibleRowIndex(allTrs, content, true, dTop, dBottom)
			if(lastRowIndex >= updatedLastRowIndex) firstRowIndex = updatedLastRowIndex
			else firstRowIndex = findFirstVisibleRowIndex(allTrs, content, false, dTop, dBottom)
	}
	js.updateSelectionFromCoords(x, firstRowIndex, x, firstRowIndex)
}

let JSpreadSheetHelper = { pageUpDown }

export { JSpreadSheetHelper }