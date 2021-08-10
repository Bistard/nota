const { ipcRenderer } = require('electron')

/**
 * @typedef {import('../../config').ConfigModule} ConfigModule
 * @typedef {import('../markdown/markdown').MarkdownModule} MarkdownModule
 */

/**
 * @description TitleBarModule stores and handles all the titleBar and toolBar 
 * relevant business. 
 */
class TitleBarModule {
    
    /**
     * @param {ConfigModule} ConfigModule
     * @param {MarkdownModule} MarkdownModule
     */
    constructor(ConfigModule, MarkdownModule) {
        
        this.Config = ConfigModule
        this.Markdown = MarkdownModule

        /** @type {String} */
        this.markdownMode = this.Config.defaultMarkdownMode
        
        /** @type {Boolean} */
        this.isToolBarExpand = this.Config.isToolBarExpand
        
        /** @type {Boolean} */
        this.isMarkdownToolExpand = false
        
        /** @type {Boolean} */
        this.isTabBarExpand = false

        this.initToolBar()

        this.setListeners()
    }
    
    /**
     * @description function calls when the ToolBarModule is initialized.
     * 
     * @returns {void} void
     */
     initToolBar() {
        if (this.markdownMode == 'wysiwyg') {
            $('#mode-switch').addClass('tool-button-focus')
        }

        if (this.isToolBarExpand == false) {
            this.toolBarStateChange(false)
        }

        if (this.isMarkdownToolExpand == false) {
            $('.toastui-editor-toolbar').first().hide(0)
        }
    }

    /**
     * @description change the mode of markdown renderering method. They are 
     * 'wysiwyg', instant rendering and split view.
     * 
     * @param {String} mode 
     * @returns {void} void
     */
     markdownModeSwitch(mode) {
        if (mode == 'wysiwyg') {
            $('#mode-switch').removeClass('tool-button-focus')
            $('#mode-switch > img').attr('src', 'assets/svg/titleBarView/md-split.svg')
            this.Markdown.editor.changeMode('markdown', true)
            this.markdownMode = 'split'
        } else if (mode == 'instant') {
            // TODO: complete instant-mode (big update)
        } else { // (mode == 'split')
            $('#mode-switch').addClass('tool-button-focus')
            $('#mode-switch > img').attr('src', 'assets/svg/titleBarView/md-wysiwyg.svg')
            this.Markdown.editor.changeMode('wysiwyg', true)
            this.markdownMode = 'wysiwyg'
        }
    }

    /**
     * @description change the state of view of markdown tool.
     * 
     * @param {Boolean} shouldExpand 
     * @returns {void} void
     */
    mdToolStateChange(shouldExpand) {
        if (shouldExpand) {
            $('.toastui-editor-toolbar').show(100)
            $('#md-tool').addClass('tool-button-focus')
            this.isMarkdownToolExpand = true
        } else {
            $('.toastui-editor-toolbar').hide(100)
            $('#md-tool').removeClass('tool-button-focus')
            this.isMarkdownToolExpand = false
        }
    }

    /**
     * @description change the state of view of toolBar.
     * 
     * @param {Boolean} shouldExpand 
     * @returns {void} void
     */
     toolBarStateChange(shouldExpand) {
        if (shouldExpand) {
            $('#tool-bar').show(100)
            $('#expand-collapse > img').attr('src', 'assets/svg/titleBarView/caret-left.svg')
            this.isToolBarExpand = true
        } else {
            $('#tool-bar').hide(100)
            $('#expand-collapse > img').attr('src', 'assets/svg/titleBarView/caret-right.svg')
            this.isToolBarExpand = false
        }
    }

    /**
     * @description handling .svg of maxResButton
     * 
     * @param {boolean} isMaxApp is winMain maximized or not
     * @returns {void} void
     */
    changeMaxResBtn(isMaxApp) {
        if (isMaxApp) {
            document.getElementById('maxBtnImg').src='assets/svg/titleBarView/max-restore.svg'
        } else {
            document.getElementById('maxBtnImg').src='assets/svg/titleBarView/max.svg'
        }
    }

    /**
     * @description mianly setting up button listeners for the titleBar and 
     * toolBar.
     * 
     * @returns {void} void
     */
    setListeners() {
        
        $('#mode-switch').on('click', () => {
            this.markdownModeSwitch(this.markdownMode)
        })

        $('#md-tool').on('click', () => {
            this.mdToolStateChange(!this.isMarkdownToolExpand)
        })

        $('#expand-collapse').on('click', () => {
            this.toolBarStateChange(!this.isToolBarExpand)
        })

        $('#minBtn').on('click', () => {
            ipcRenderer.send('minApp')
        })
        
        $('#maxBtn').on('click', () => {
            ipcRenderer.send('maxResApp')
        })
        
        $('#closeBtn').on('click', () => {
            ipcRenderer.send('closeApp')
        })

        ipcRenderer.on('isMaximized', () => { 
            this.changeMaxResBtn(true)
        })

        ipcRenderer.on('isRestored', () => { 
            this.changeMaxResBtn(false) 
        })
        
    }
}

module.exports = { TitleBarModule }
