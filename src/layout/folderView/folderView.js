const { ipcRenderer } = require('electron');
const ipc = ipcRenderer;

var isFileClicked = true;
var isOutlineClicked = false;

const folderBtn = document.getElementById('folderBtn');
const outlineBtn = document.getElementById('outlineBtn');
const emptyFolderTag = document.getElementById('emptyFolderTag');
const folderView = document.getElementById('folderView');
const mdView = document.getElementById('mdView');

folderBtnSelected(true);

function openNewFolder() {
    ipc.send('openNewFolder');
}

function folderBtnSelected(isFolderSelected) {
    if (isFolderSelected) {
        folderBtn.style.color = '#65655F';
        folderBtn.style.fontWeight = 'bold';
        folderBtn.style.borderBottom = '2px solid #5b5b55';
        emptyFolderTag.innerHTML = 'open a folder';
        outlineBtn.style.color = '#9f9f95';
        outlineBtn.style.fontWeight = 'normal';
        outlineBtn.style.borderBottom = '2px solid transparent';

        emptyFolderTag.addEventListener('click', openNewFolder)
    } else {
        outlineBtn.style.color = '#65655F';
        outlineBtn.style.fontWeight = 'bold';
        outlineBtn.style.borderBottom = '2px solid #5b5b55';
        emptyFolderTag.innerHTML = 'outline is empty';
        folderBtn.style.color = '#9f9f95';
        folderBtn.style.fontWeight = 'normal';
        folderBtn.style.borderBottom = '2px solid transparent';

        emptyFolderTag.removeEventListener('click', openNewFolder);
    }
}

folderBtn.addEventListener('click', () => {
    if (isFileClicked == false) {
        isFileClicked = true;
        isOutlineClicked = false;
        folderBtnSelected(true);
    }
})

outlineBtn.addEventListener('click', () => {
    if (isOutlineClicked == false) {
        isOutlineClicked = true;
        isFileClicked = false;
        folderBtnSelected(false);
    }
})

// resizing folderView
let oldX;
const resize = document.getElementById("resize");

function resizeFolderView(event) {
    let dx = oldX - event.x;
    oldX = event.x;
    folderView.style.width = (parseInt(getComputedStyle(folderView, '').width) - dx) + "px";
    mdView.style.width = (parseInt(getComputedStyle(mdView, '').width) + dx) + "px";
}

resize.addEventListener("mousedown", function (event) {
    oldX = event.x;
    document.addEventListener("mousemove", resizeFolderView, false);
}, false);

document.addEventListener("mouseup", function () {
    document.removeEventListener("mousemove", resizeFolderView, false);
}, false);