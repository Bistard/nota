const { ipcRenderer } = require("electron")
const Editor = require('@toast-ui/editor')

const markdown = document.getElementById('md')

class MarkDownViewModule {
    constructor() {
        this.toolBar = null
        this.editor = null
        this.createMarkdownEditor()
        this.setListeners()
    }

    setListeners() {
        
    }

    createMarkdownEditor() {
        this.editor = new Editor({
            el: markdown,
            height: '100%',
            language: 'zh-CN',
            previewStyle: 'tab',
            hideModeSwitch: true,
            initialEditType: 'wysiwyg',
            events: {
                /* 
                load: null,
                change: null,
                focus: null,
                blur: null,
                keydown: null,
                keyup: null 
                */
            },
            useCommandShortcut: true,
            placeholder: '',
            previewHighlight: false,
          });

        this.editor.getMarkdown();
    }

}

var markDownModule = new MarkDownViewModule()
window.editor = markDownModule.editor
    
module.exports = { MarkDownViewModule }
