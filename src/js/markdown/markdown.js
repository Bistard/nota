const { ipcRenderer } = require("electron")
const Editor = require('@toast-ui/editor')

const markdown = document.getElementById('md')

class MarkDownModule {
    constructor() {
        this.toolBar = null
        this.editor = null
        this.saveFileTimeout = null
        this.saveFileCallback = null
        this.createMarkdownEditor()
    }

    createMarkdownEditor() {
        this.editor = new Editor({
            el: markdown,
            height: '100%',
            language: 'zh-CN',
            previewStyle: 'tab',
            previewHighlight: true,
            useCommandShortcut: true,
            hideModeSwitch: false,
            initialEditType: 'wysiwyg',
            events: {
                // load: null,
                // change: this.setSaveFileTimeout,
                // focus: null,
                // blur: null,
                // keydown: null,
                // keyup: null 
            },
            placeholder: '',
          })

        this.editor.getMarkdown()
        window.editor = this.editor
    }

    setSaveFileTimeout() {
        if (this.saveFileTimeout) {
            clearTimeout(this.saveFileTimeout)
        }
        if (this.saveFileCallback) {
            this.saveFileTimeout = setTimeout(this.saveFileCallback, 1000)
        }
    }

    setSaveFileCallback(callback) {
        this.saveFileCallback = callback
    }

}
    
module.exports = { MarkDownModule }
