const { ipcRenderer } = require("electron")

/**
 * @description ActionBarModule provides access to each action view and handles 
 * the state transition between each action button and display coressponding 
 * action view.
 */
class ActionBarModule {

    constructor() {

        // indicates which action button is focused, -1 if none.
        this.currFocusActionBtnIndex = 0

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
    }

    /**
     * @description clicks a given button. If it is not focused, set it as focused
     * 
     * @param {HTMLElement} clickedBtn 
     * @returns {void} void
     */
    clickActionBtn(clickedBtn) {
        const clickedBtnIndex = parseInt(clickedBtn.getAttribute('btnNum'))
        const actionBtnContainer = clickedBtn.parentNode
        const currBtn = actionBtnContainer.children[this.currFocusActionBtnIndex]
            
        if (this.currFocusActionBtnIndex == -1) {
            // none of action button is focused, open the action view
            this.currFocusActionBtnIndex = clickedBtnIndex
            this.openActionView()
            clickedBtn.classList.add('action-button-focus')
        } else if (this.currFocusActionBtnIndex == clickedBtnIndex) {
            // if the current focused button is clicked again, close action view.
            this.currFocusActionBtnIndex = -1
            this.closeActionView()
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