function loadCSS(cssStyles) {
    const link = document.createElement('link')
    link.href = `data:text/css;base64,${btoa(cssStyles)}`
    link.type = 'text/css'
    link.rel = 'stylesheet'
    document.getElementsByTagName('head')[0].appendChild(link)
}

function enableFileDrop(elementId, draggingClass, 
		fileProcessor = function(file) { 
			console.log("Default file processor for: "+file.name) }) {
	window.addEventListener("DOMContentLoaded", () => {
		const dropZone = document.getElementById(elementId)
		loadCSS(`#${elementId}.${draggingClass} * { pointer-events: none; }`)

		function preventDefault(e) { e.preventDefault() }

		function dragleave(e, force=false) {
			if(force || ! dropZone.contains( e.target ))
				dropZone.classList.remove(draggingClass)
				preventDefault(e)
		}

		function dragenter(e) {
			dropZone.classList.add(draggingClass)
			preventDefault(e)
		}

		function drop(e) {
			dragleave(e, true)
			if(e?.dataTransfer?.files?.length >= 1)
				fileProcessor(e?.dataTransfer?.files[0])
		}

		dropZone.addEventListener("dragover", preventDefault)
		dropZone.addEventListener("dragstart", preventDefault)
		dropZone.addEventListener("dragenter", dragenter)
		dropZone.addEventListener("dragleave", dragleave)
		dropZone.addEventListener("drop", drop)
	})
}

export { enableFileDrop }