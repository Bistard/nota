const { ipcRenderer } = require('electron')
const ipc = ipcRenderer

const FolderTreeModule = require('./foldertree')

var FolderTree = new FolderTreeModule.FolderTree()
var isFileClicked = true
var isOutlineClicked = false

const folderBtn = document.getElementById('folderBtn')
const outlineBtn = document.getElementById('outlineBtn')
const emptyFolderTag = document.getElementById('emptyFolderTag')
const folderView = document.getElementById('folderView')
const mdView = document.getElementById('mdView')

function openNewFolder() {
    ipc.send('openNewFolder')
}

ipcRenderer.on('openFile', (event, path, stat) => {
    let rawFile = new XMLHttpRequest()
    rawFile.open("GET", path, false)
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState == 4) {
            if (rawFile.status == 200 || rawFile.status == 0) {
                let plainText = rawFile.responseText;
                window.vditor.insertValue(plainText, true);
            }
        }
    }
    rawFile.send(null)
})

ipcRenderer.on('openFolder', (event, path, stat) => {
    let tree = FolderTree.getFolderTree(path)
    // TODO: display tree
    /* let treeList = FolderTree.getFolderTreeList(tree) */
    ipc.send('test', tree)
})

folderBtnSelected(true)

function folderBtnSelected(isFolderSelected) {
    if (isFolderSelected) {
        folderBtn.style.color = '#65655F'
        folderBtn.style.fontWeight = 'bold'
        folderBtn.style.borderBottom = '2px solid #5b5b55'
        emptyFolderTag.innerHTML = 'open a folder'
        outlineBtn.style.color = '#9f9f95'
        outlineBtn.style.fontWeight = 'normal'
        outlineBtn.style.borderBottom = '2px solid transparent'

        emptyFolderTag.addEventListener('click', openNewFolder)
    } else {
        outlineBtn.style.color = '#65655F'
        outlineBtn.style.fontWeight = 'bold'
        outlineBtn.style.borderBottom = '2px solid #5b5b55'
        emptyFolderTag.innerHTML = 'outline is empty'
        folderBtn.style.color = '#9f9f95'
        folderBtn.style.fontWeight = 'normal'
        folderBtn.style.borderBottom = '2px solid transparent'

        emptyFolderTag.removeEventListener('click', openNewFolder)
    }
}

folderBtn.addEventListener('click', () => {
    if (isFileClicked == false) {
        isFileClicked = true
        isOutlineClicked = false
        folderBtnSelected(true)
    }
})

outlineBtn.addEventListener('click', () => {
    if (isOutlineClicked == false) {
        isOutlineClicked = true
        isFileClicked = false
        folderBtnSelected(false)
    }
})

//////////////////////////// resizing folderView ///////////////////////////////
let oldX
const resize = document.getElementById("resize")

function resizeFolderView(event) {
    let dx = oldX - event.x
    oldX = event.x
    /* new X has to be calculated first, than concatenates with "px", otherwise
       the string will be like newX = "1000+2px" and losing accuracy */
    let folderViewNewX = parseInt(getComputedStyle(folderView, '').width) - dx
    let mdViewNewX = parseInt(getComputedStyle(mdView, '').width) + dx
    folderView.style.width = folderViewNewX + "px"
    mdView.style.width = mdViewNewX + "px"
}

resize.addEventListener("mousedown", function (event) {
    oldX = event.x
    document.addEventListener("mousemove", resizeFolderView, false)
}, false)

document.addEventListener("mouseup", function () {
    document.removeEventListener("mousemove", resizeFolderView, false)
}, false)
