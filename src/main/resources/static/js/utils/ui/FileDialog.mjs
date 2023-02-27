export class FileDialog {
    open(acceptedFilePatterns, readFile = (file) => { console.log(`Default file handler: ${file.name}`)}, closeFunction = () => {}) {
        let input = document.createElement('input')
        let opening = false
        input.type = 'file'
        input.accept = acceptedFilePatterns
        input.onchange = function(event) {
            opening = true
            readFile(input.files[0])
        }

        function addDialogClosedListener(input, callback) {
            let id = null
            let active = false
            let wrapper = function() { if (active) { active = false; callback() } }
            let cleanup = function() { clearTimeout(id) }
            let shedule = function(delay) { id = setTimeout(wrapper, delay) }
            let onFocus = function() { cleanup(); shedule(1000) }
            let onBlur = function() { cleanup() }
            let onClick = function() { cleanup(); active = true}
            let onChange = function() { cleanup(); shedule(0) }
            input.addEventListener('click', onClick)
            input.addEventListener('change', onChange)
            window.addEventListener('focus', onFocus)
            window.addEventListener('blur', onBlur)
            return function() {
                input.removeEventListener('click', onClick)
                input.removeEventListener('change', onChange)
                window.removeEventListener('focus', onFocus)
                window.removeEventListener('blur', onBlur)
            }
        }

        addDialogClosedListener(input, function() {
            if(!opening) closeFunction()
            console.log('File dialog closed!')
        })

        input.click()
    }
}
