const { ipcRenderer } = require("electron")

/**
 * @description ActionViewModule displays different action view such as 
 * folderView, outlineView, gitView and so on.
 */
class ActionViewModule {

    constructor() {

        /** 
         * @readonly 'folder', 'outline', 'git'
         * @type {String} 
         * */
        this.whichActionView = ''

    }

    /**
     * @description switch to that action view given a specific name.
     * 
     * @param {String} actionViewName 
     * @returns {void} void
     */
    switchToActionView(actionViewName) {
        if (actionViewName == this.whichActionView) {
            return
        }
        
        this.displayActionViewTopText(actionViewName)
        // this.hideActionViewContent()
        
        if (actionViewName == 'folder') {
            
        } else if (actionViewName == 'outline') {
        
        } else if (actionViewName == 'search') {

        } else if (actionViewName == 'git') {
        
        } else {
            throw 'error'
        }

        this.whichActionView = actionViewName
    }

    /**
     * @description display given text on the action view top.
     * 
     * @param {String} name
     * @returns {void} void
     */
    displayActionViewTopText(name) {
        if (name == 'folder') {
            $('#action-view-top-text').html('Notebook')
        } else if (name == 'git') {
            $('#action-view-top-text').html('Git Control')
        } else {
            $('#action-view-top-text').html(name)
        }
    }

    /**
     * @description simple function for hiding the content of action view.
     * 
     * @returns {void} void
     */
    hideActionViewContent() {
        $('#action-view-container').children().each(function() {
            $(this).hide(0)
        })
    }

    /**
     * @description NOT displaying action view.
     * 
     * @returns {void} void
     */
     closeActionView() {
        $('#action-view').hide(0)
        $('#resize').hide(0)
        this.isActionViewActive = false
    }
    
    /**
     * @description displays action view.
     * 
     * @returns {void} void
     */
    openActionView() {
        $('#action-view').show(0)
        $('#resize').show(0)
        this.isActionViewActive = true
    }


}

module.exports = { ActionViewModule }