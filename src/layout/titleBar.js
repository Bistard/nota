const { ipcRenderer } = require('electron')
const ipc = ipcRenderer

const maxBtn = document.getElementById('maxBtn')
const folderView = document.getElementById('folderView')
const resize = document.getElementById('resize')
let folderViewChilds = Array.from(folderView.childNodes)

var isfolderViewActive = true

// titleBar listener
minBtn.addEventListener('click', () => {
    ipc.send('minApp')
})

maxBtn.addEventListener('click', () => {
    ipc.send('maxResApp')
})

closeBtn.addEventListener('click', () => {
    ipc.send('closeApp')
})

function changeMaxResBtn(isMaxApp) {
    if (isMaxApp) {
        document.getElementById('maxBtnImg').src='assets/icons/max-restore.svg'
    } else {
        document.getElementById('maxBtnImg').src='assets/icons/max.svg'
    }
}

ipc.on('isMaximized', () => { 
    changeMaxResBtn(true)
})
ipc.on('isRestored', () => { changeMaxResBtn(false) })

///////////////////////////// menuBtn listener /////////////////////////////////
menuBtn.addEventListener('click', () => {
    if (isfolderViewActive) {
        closeMenu()
    } else {
        openMenu()
    }
})

function closeMenu() {
    folderView.style.width = '0px'
    folderView.innerHTML = ''
    resize.style.width = '0px'
    isfolderViewActive = false
}

function openMenu() {
    folderView.style.width = '300px'
    for (let i in folderViewChilds) {
        folderView.appendChild(folderViewChilds[i])
    }
    resize.style.width = '4px'
    isfolderViewActive = true
}