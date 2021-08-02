const { ipcRenderer } = require("electron")

// see more details on this library: https://github.com/nhn/tui.editor#-packages
const Editor = require('@toast-ui/editor')
const Prism = require('../../../node_modules/prismjs/prism')
const codeSyntaxHighlight = require('@toast-ui/editor-plugin-code-syntax-highlight');

const markdown = document.getElementById('md')

/**
 * @typedef {import('../config').ConfigModule} ConfigModule
 * @typedef {import('../folderView/folder').FolderModule} FolderModule
 */

/**
 * @description MarkdownModule initializes markdown renderer and windows and
 * handling a few other shortcuts as well.
 */
class MarkdownModule {
    
    /**
     * @param {ConfigModule} ConfigModule
     * @param {FolderModule} FolderModule
     */
    constructor(ConfigModule, FolderModule) {
        this.Config = ConfigModule
        this.Folder = FolderModule

        /**
         * @type {Editor}
         */
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
            /**
             * @argument 'tab'
             * @argument 'vertical'
             */
            previewStyle: 'vertical',
            previewHighlight: false,
            useCommandShortcut: true,
            usageStatistics: true,      // send hostname to google analytics
            hideModeSwitch: true,
            /**
             * @argument 'wysiwyg' = 'what you see is what you get'
             * @argument 'markdown'
             */
            initialEditType: 'wysiwyg', 
            /**
             * @readonly this 'events' attribute handles callback functions to 
             * serval editor events.
             * 
             * @member load
             * @member change
             * @member focus
             * @member blur
             * @member keydown
             * @member keyup
             */
            events: {
                /**
                 * @description It would be emitted when content changed.
                 * 
                 * @type {Function}
                 */
                change: () => { this.onChange() },
            },
            placeholder: '',
            plugins: [
                [codeSyntaxHighlight, { highlighter: Prism }],
            ],
        })

        editor.getMarkdown()
        this.editor = editor
        window.editor = editor // set as global value

        // spellcheck config check
        if (!this.Config.markdownSpellCheckOn) {
            const md = document.getElementById('md')
            md.setAttribute('spellcheck', 'false')
        }

    }

    /**
     * @description callback function for 'editor.event.change'.
     * 
     * @returns {void} void
     */
    onChange() {
        // check if file-auto-save is ON
        if (this.Config.fileAutoSaveOn) {
            // if content is changed before the previous timeout has 
            // reached, clear the preivous one.
            if (this.saveFileTimeout) {
                clearTimeout(this.saveFileTimeout)
            }
            // set a new timer with 1000 microseconds
            this.saveFileTimeout = setTimeout(() => {
                this.markdownSaveFile()
            }, 1000)
        }
    }

    /**
     * @description calling saveFile() from FolderModule.
     * 
     * @returns {void} void
     */
    markdownSaveFile() {
        const index = this.Folder.TabBar.currFocusTabIndex       /** @type {Number} */
        const nodeInfo = this.Folder.TabBar.openedTabInfo[index] /** @type {TreeNode} */
        const newText = this.editor.getMarkdown()                /** @type {String} */
        this.Folder.saveFile(nodeInfo, newText)
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
