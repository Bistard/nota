const { ipcRenderer } = require('electron');

const maxBtn = document.getElementById('maxBtn');
const folderView = document.getElementById('folderView');
let folderViewChilds = Array.from(folderView.childNodes);

var isfolderViewActive = true;

// titleBar listener
minBtn.addEventListener('click', () => {
    ipcRenderer.send('minApp');
})

maxBtn.addEventListener('click', () => {
    ipcRenderer.send('maxResApp');
})

closeBtn.addEventListener('click', () => {
    ipcRenderer.send('closeApp');
})

function changeMaxResBtn(isMaxApp) {
    if (isMaxApp) {
        maxBtn.classList.remove('maxBtn');
        maxBtn.classList.add('restoreBtn');
    } else {
        maxBtn.classList.remove('restoreBtn');
        maxBtn.classList.add('maxBtn');
    }
}

ipcRenderer.on('isMaximized', () => { changeMaxResBtn(true) })
ipcRenderer.on('isRestored', () => { changeMaxResBtn(false) })

// menuBtn listener
menuBtn.addEventListener('click', () => {
    if (isfolderViewActive) {
        closeMenu();
    } else {
        openMenu();
    }
})

function closeMenu() {
    folderView.style.width = '0px';
    folderView.innerHTML = '';
    isfolderViewActive = false;
}

function openMenu() {
    folderView.style.width = '300px';
    for (let i in folderViewChilds) {
        folderView.appendChild(folderViewChilds[i]);
    }
    isfolderViewActive = true;
}