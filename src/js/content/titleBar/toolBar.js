/**
 * @typedef {import('../../config').ConfigModule} ConfigModule
 */

/**
 * @description ToolBarModule controls all the functionalities of tool bar 
 * buttons.
 */
class ToolBarModule {

    /**
     * @param {ConfigModule} ConfigModule
     */
    constructor(ConfigModule) {
        this.Config = ConfigModule

        this.isToolBarExpand = this.Config.isToolBarExpand
        this.markdownMode = this.Config.defaultMarkdownMode
        this.isMarkdownToolExpand = false
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

        } else if (mode == 'instant') {

        } else { // (mode == 'split-view')

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
        } else {
            $('.toastui-editor-toolbar').hide(100)
            $('#md-tool').removeClass('tool-button-focus')
        }
        this.isMarkdownToolExpand ^= true
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
            $('#expand-collapse > img').attr('src', 'assets/icons/toolBarView/caret-left.svg')
        } else {
            $('#tool-bar').hide(100)
            $('#expand-collapse > img').attr('src', 'assets/icons/toolBarView/caret-right.svg')
        }
        this.isToolBarExpand ^= true
    }

    /**
     * @description mainly set listeners for each group button in the tool bar.
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


    }
}

module.exports = { ToolBarModule }