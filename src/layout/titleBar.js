const { ipcRenderer } = require('electron');

const folderView = document.getElementById('folderView');
let folderViewChilds = Array.from(folderView.childNodes);

var isfolderViewActive = true;

// titleBar listener
minButton.addEventListener('click', () => {
    ipcRenderer.send('minApp');
})

maxButton.addEventListener('click', () => {
    ipcRenderer.send('maxApp');
})

closeButton.addEventListener('click', () => {
    ipcRenderer.send('closeApp');
})

// menuButton listener
menuButton.addEventListener('click', () => {
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