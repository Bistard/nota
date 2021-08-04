const { ipcRenderer } = require('electron')

const minBtn = document.getElementById('minBtn')
const maxBtn = document.getElementById('maxBtn')
const closeBtn = document.getElementById('closeBtn')

/**
 * @description TitleBarModule stores and handles all the titleBar relevant 
 * business. 
 */
class TitleBarModule {
    
    constructor() {
        this.setListeners()
    }

    /**
     * @description handling .svg of maxResButton
     * 
     * @param {boolean} isMaxApp is winMain maximized or not
     * @returns {void} void
     */
    changeMaxResBtn(isMaxApp) {
        if (isMaxApp) {
            document.getElementById('maxBtnImg').src='assets/icons/max-restore.svg'
        } else {
            document.getElementById('maxBtnImg').src='assets/icons/max.svg'
        }
    }

    /**
     * @description mianly setting up button listeners for the titleBar.
     * 
     * @returns {void} void
     */
    setListeners() {
        
        minBtn.addEventListener('click', () => {
            ipcRenderer.send('minApp')
        })
        
        maxBtn.addEventListener('click', () => {
            ipcRenderer.send('maxResApp')
        })
        
        closeBtn.addEventListener('click', () => {
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
