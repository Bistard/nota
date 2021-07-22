const { ipcRenderer } = require('electron');

const titleBar = document.getElementById('titleBar');
const folderView = document.getElementById('folderView');
const folderNavBar = document.getElementById('folderNavBar');

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

// menu listener
menu.addEventListener('click', () => {
    if (isfolderViewActive) {
        folderView.style.width = '0px';
        closeMenu();
        isfolderViewActive = false;
    } else {
        folderView.style.width = '300px';
        openMenu();
        isfolderViewActive = true;
    }
})

// BUG

function closeMenu(folderView) {
    while (folderView.firstChild) {
        folderView.removeChild(element.firstChild);
    }
}

function openMenu(folderView) {
    folderView.appendChild(folderNavBar);
}