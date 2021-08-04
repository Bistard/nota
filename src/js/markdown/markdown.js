const { ipcRenderer } = require("electron")

// @toast-ui: see more details on this library: https://github.com/nhn/tui.editor#-packages
const Editor = require('@toast-ui/editor')

// @toast-ui-plugin: code syntax highlight
const Prism = require('../../../node_modules/prismjs/prism')
const codeSyntaxHighlight = require('../../../node_modules/@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all');

// @toast-ui-plugin: color syntax 
const colorSyntax = require('@toast-ui/editor-plugin-color-syntax');


const markdown = document.getElementById('md')

// @toast-ui-plugin: language pack require
/* require('../../../node_modules/@toast-ui/editor/dist/i18n//zh-cn') */

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

        /**
         * The object is a preset color choices for color-syntax plugin.
         */
        this.colorSyntaxOptions = {
            preset: ['#ff0000', // red
                     '#ff8f00', // orange
                     '#fff600', // yellow
                     '#52ff00', // green
                     '#007dff', // blue
                     '#5200ff', // indigo
                     '#ad00ff'] // violet
        };

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
            language: 'en-US',
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
                 * @readonly It would be emitted when content changed.
                 */
                change: () => { this.onChange() },
            },
            placeholder: '',
            plugins: [
                [codeSyntaxHighlight, { highlighter: Prism }],
                [colorSyntax, this.colorSyntaxOptions]
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

        // removing default markdown tool bar
        /* $('.toastui-editor-toolbar').each(function() {
            $(this).hide(0)
        }) */


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
