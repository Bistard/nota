const { ipcRenderer } = require('electron');

const titleBar = document.getElementById('titleBar');
const leftOutline = document.getElementById('leftOutline');

var isLeftOutlineActive = true;

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

menu.addEventListener('click', () => {
    if (isLeftOutlineActive) {
        leftOutline.style.width = '0px';
        isLeftOutlineActive = false;
    } else {
        leftOutline.style.width = '300px';
        isLeftOutlineActive = true;
    }
})