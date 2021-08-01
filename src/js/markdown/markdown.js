const { ipcRenderer } = require("electron")
const Editor = require('@toast-ui/editor')

const markdown = document.getElementById('md')

class MarkDownModule {
    
    constructor(FolderModule) {
        this.Folder = FolderModule
        this.editor = null
        this.saveFileTimeout = null
        this.createMarkdownEditor()
        this.setListeners()
    }

    createMarkdownEditor() {
        let editor = new Editor({
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
                change: () => {
                    if (this.saveFileTimeout) {
                        clearTimeout(this.saveFileTimeout)
                    }
                    this.saveFileTimeout = setTimeout(() => {
                        this.markdownSaveFile()
                    }, 1000) // 1 sec delay
                },
                // focus: null,
                // blur: null,
                // keydown: null,
                // keyup: null 
            },
            placeholder: '',
        })

        editor.getMarkdown()
        this.editor = editor
        window.editor = editor
    }

    markdownSaveFile() {
        const index = this.Folder.TabBar.currFocusTabIndex
        const nodeInfo = this.Folder.TabBar.openedTabInfo[index]
        this.Folder.saveFile(nodeInfo)
    }

    setListeners() {

        ipcRenderer.on('Ctrl+S', () => {
            if (!this.Folder.TabBar.emptyTab) {
                clearTimeout(this.saveFileTimeout)
                this.markdownSaveFile()
            }
        })

    }

}
    
module.exports = { MarkDownModule }
