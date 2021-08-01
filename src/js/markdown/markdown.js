const { ipcRenderer } = require("electron")
const Editor = require('@toast-ui/editor')

const markdown = document.getElementById('md')

/**
 * @description MarkdownModule initializes markdown renderer and windows and
 * handling a few other shortcuts as well.
 */
class MarkdownModule {
    
    /**
     * @param {FolderModule} FolderModule
     */
    constructor(FolderModule) {
        
        this.Folder = FolderModule
        this.editor = null
        
        /**
         * after markdown content is changed, a timeout will be set when the 
         * auto-save mode is turned on. When the time has arrived, file will be
         * auto saved.
         * 
         * @type {NodeJS.Timeout}
         */
        this.saveFileTimeout = null

        this.createMarkdownEditor()
        this.setListeners()
    }

    /**
     * @description instantiates editor constructor and markdown view. Editor's
     * events's callback functions will also be set here.
     * 
     * @returns {void} void
     */
    createMarkdownEditor() {

        let editor = new Editor({
            el: markdown,               // HTMLElement container for md editor
            height: '100%',
            language: 'zh-CN',
            previewStyle: 'tab',
            previewHighlight: true,
            useCommandShortcut: true,
            hideModeSwitch: false,      // hide ModeSwitch Button
            initialEditType: 'wysiwyg', // 'what you see is what you get' mode
            
            // this 'events' attribute handles callback functions to serval 
            // editor events.
            events: {
                // load: null,

                /**
                 * @description It would be emitted when content changed.
                 * 
                 * @type {function}
                 */
                change: () => {
                    // if content is changed before the previous timeout has 
                    // reached, clear the preivous one.
                    if (this.saveFileTimeout) {
                        clearTimeout(this.saveFileTimeout)
                    }
                    // set a new timer with 1000 microseconds delay
                    this.saveFileTimeout = setTimeout(() => {
                        this.markdownSaveFile()
                    }, 1000)
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

        // set as global value
        window.editor = editor
    }

    /**
     * @description calling saveFiles() from FolderModule.
     * 
     * @returns {void} void
     */
    markdownSaveFile() {
        const index = this.Folder.TabBar.currFocusTabIndex
        const nodeInfo = this.Folder.TabBar.openedTabInfo[index]
        this.Folder.saveFile(nodeInfo)
    }

    /**
     * @description setup markdown relevant listeners.
     * 
     * @returns {void} void
     */
    setListeners() {

        ipcRenderer.on('Ctrl+S', () => {
            if (!this.Folder.TabBar.emptyTab) {
                clearTimeout(this.saveFileTimeout)
                this.markdownSaveFile()
            }
        })

    }

}
    
module.exports = { MarkdownModule }
