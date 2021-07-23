const { ipcRenderer } = require('electron');

const titleBar = document.getElementById('titleBar');
const folderView = document.getElementById('folderView');
let folderViewChilds = Array.from(folderView.childNodes);
const folderNavBar = document.getElementById('folderNavBar');
const folderTree = document.getElementById('folderTree');

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
        folderView.innerHTML = '';
        isfolderViewActive = false;
    } else {
        folderView.style.width = '300px';
        for (let i in folderViewChilds) {
            folderView.appendChild(folderViewChilds[i]);
        }
        isfolderViewActive = true;
    }
})
