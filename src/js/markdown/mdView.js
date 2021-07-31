const { ipcRenderer } = require("electron")
const Editor = require('@toast-ui/editor')

const markdown = document.getElementById('md')

class MarkDownViewModule {
    constructor() {
        this.toolBar = null
        this.editor = this.createMarkdownEditor()
        this.setListeners()
    }

    setListeners() {
        
    }

    createMarkdownEditor() {
        this.editor = new Editor({
            el: markdown,
            height: '100%',
            language: 'zh_CN',
            initialEditType: 'wysiwyg',
            previewStyle: 'tab',
            hideModeSwitch: true,
          });

        this.editor.getMarkdown();
    }

}

let markDownModule = new MarkDownViewModule()
window.editor = markDownModule.editor
    
window.onload = function () {
    /* let toolBar = document.getElementsByClassName('vditor-toolbar')[0]
    markdown.removeChild(toolBar) */
}



module.exports = { MarkDownViewModule }
