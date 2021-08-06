const { ipcRenderer } = require("electron")

/**
 * @typedef {import('../actionView/actionView').ActionViewModule} ActionViewModule
 */

/**
 * @description ActionBarModule provides access to each action view and handles 
 * the state transition between each action button and display coressponding 
 * action view.
 */
class ActionBarModule {

    constructor(ActionViewModule) {

        this.ActionView = ActionViewModule

        // indicates which action button is focused, -1 if none.
        this.currFocusActionBtnIndex = -1

        // indicates whether action view is opened or not.
        this.isActionViewActive = false

        this.initActionBar()
        this.setListeners()
    }

    /**
     * @description initialize creating action bar.
     * 
     * @returns {void} void
     */
    initActionBar() {
        // give every actionButton a unique number.
        $('.action-button').each(function(index, element) {
            element.setAttribute('btnNum', index.toString())
        })
        
        this.clickActionBtn(document.getElementById('folder-button'))
    }

    /**
     * @description clicks a given button. If it is not focused, set it as 
     * focused. Moreover, switch to that action view.
     * 
     * @param {HTMLElement} clickedBtn 
     * @returns {void} void
     */
    clickActionBtn(clickedBtn) {
        // get which action button is clicking
        const actionName = clickedBtn.id.slice(0, -"-button".length)
        
        // switch to the action view
        this.ActionView.switchToActionView(actionName)

        // focus the action button and reverse the state of action view
        const clickedBtnIndex = parseInt(clickedBtn.getAttribute('btnNum'))
        const actionBtnContainer = clickedBtn.parentNode
        const currBtn = actionBtnContainer.children[this.currFocusActionBtnIndex]
            
        if (this.currFocusActionBtnIndex == -1) {
            // none of action button is focused, open the action view
            this.currFocusActionBtnIndex = clickedBtnIndex
            this.ActionView.openActionView()
            clickedBtn.classList.add('action-button-focus')
        } else if (this.currFocusActionBtnIndex == clickedBtnIndex) {
            // if the current focused button is clicked again, close action view.
            this.currFocusActionBtnIndex = -1
            this.ActionView.closeActionView()
            currBtn.classList.remove('action-button-focus')
        } else if (this.currFocusActionBtnIndex >= 0) {
            // other action button is clicked, only change the style
            this.currFocusActionBtnIndex = clickedBtnIndex
            currBtn.classList.remove('action-button-focus')
            clickedBtn.classList.add('action-button-focus')
        } else {
            throw 'error'
        }
    }

    /**
     * @description set actionBar listeners.
     * 
     * @returns {void} void
     */
    setListeners() {

        $('.action-button').on('click', { ActionBarModule: this }, function (event) {
            let that = event.data.ActionBarModule
            that.clickActionBtn(this)
        })
    }

}

module.exports = { ActionBarModule }