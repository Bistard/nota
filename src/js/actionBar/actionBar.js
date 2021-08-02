const { ipcRenderer } = require("electron")

class ActionBarModule {

    constructor() {

        this.currFocusActionBtnIndex = 0
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
     * @description given an action button and set as focused.
     * 
     * @param {HTMLElement} actionBtn 
     */
    focusActionBtn(actionBtn) {
        if (this.currFocusActionBtnIndex >= 0) {
            const actionBtnContainer = actionBtn.parentNode
            const currActionBtn = actionBtnContainer.children[this.currFocusActionBtnIndex]
            currActionBtn.classList.remove('action-button-focus')
        }
        this.currFocusActionBtnIndex = parseInt(actionBtn.getAttribute('btnNum'))
        actionBtn.classList.add('action-button-focus')
    }

    /**
     * @description set actionBar listeners.
     * 
     * @returns {void} void
     */
    setListeners() {

        $('.action-button').on('click', { ActionBarModule: this }, function (event) {
            let that = event.data.ActionBarModule
            that.focusActionBtn(this)
        })
    }

}

module.exports = { ActionBarModule }