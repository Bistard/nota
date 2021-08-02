const { ipcRenderer } = require('electron')

const folderButton = document.getElementById('folder-button')
const minBtn = document.getElementById('minBtn')
const maxBtn = document.getElementById('maxBtn')
const closeBtn = document.getElementById('closeBtn')
const folderView = document.getElementById('action-view')
const resize = document.getElementById('resize')
const folderViewChilds = Array.from(folderView.childNodes)

/**
 * @description TitleBarModule stores and handles all the titleBar relevant 
 * business. 
 */
class TitleBarModule {
    
    constructor() {
        this.isFolderViewActive = true
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
     * @description NOT displaying menu.
     * 
     * @returns {void} void
     */
    closeMenu() {
        folderView.style.width = '0px'
        folderView.style.minWidth = '0px'
        folderView.innerHTML = ''
        resize.style.width = '0px'
        this.isFolderViewActive = false
    }
    
    /**
     * @description Display menu.
     * 
     * @returns {void} void
     */
    openMenu() {
        folderView.style.width = '300px'
        folderView.style.minWidth = '300px'
        for (let i in folderViewChilds) {
            folderView.appendChild(folderViewChilds[i])
        }
        resize.style.width = '4px'
        this.isFolderViewActive = true
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
        
        folderButton.addEventListener('click', () => {
            if (this.isFolderViewActive) {
                this.closeMenu()
            } else {
                this.openMenu()
            }
        })
        
    }
}

module.exports = { TitleBarModule }
