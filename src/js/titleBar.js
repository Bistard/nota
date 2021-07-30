const { ipcRenderer } = require('electron')
const ipc = ipcRenderer

const menuBtn = document.getElementById('menuBtn')
const minBtn = document.getElementById('minBtn')
const maxBtn = document.getElementById('maxBtn')
const closeBtn = document.getElementById('closeBtn')
const folderView = document.getElementById('folderView')
const resize = document.getElementById('resize')
const folderViewChilds = Array.from(folderView.childNodes)

class TitleBarModule {
    
    constructor() {
        this.isFolderViewActive = true
        this.setListeners()
    }

    changeMaxResBtn(isMaxApp) {
        if (isMaxApp) {
            document.getElementById('maxBtnImg').src='assets/icons/max-restore.svg'
        } else {
            document.getElementById('maxBtnImg').src='assets/icons/max.svg'
        }
    }
    
    closeMenu() {
        folderView.style.width = '0px'
        folderView.innerHTML = ''
        resize.style.width = '0px'
        this.isFolderViewActive = false
    }
    
    openMenu() {
        folderView.style.width = '400px'
        for (let i in folderViewChilds) {
            folderView.appendChild(folderViewChilds[i])
        }
        resize.style.width = '4px'
        this.isFolderViewActive = true
    }

    setListeners() {
        
        minBtn.addEventListener('click', () => {
            ipc.send('minApp')
        })
        
        maxBtn.addEventListener('click', () => {
            ipc.send('maxResApp')
        })
        
        closeBtn.addEventListener('click', () => {
            ipc.send('closeApp')
        })

        ipc.on('isMaximized', () => { 
            this.changeMaxResBtn(true)
        })

        ipc.on('isRestored', () => { 
            this.changeMaxResBtn(false) 
        })
        
        menuBtn.addEventListener('click', () => {
            if (this.isFolderViewActive) {
                this.closeMenu()
            } else {
                this.openMenu()
            }
        })
        
    }
}

new TitleBarModule()

module.exports = { TitleBarModule }
