const { ipcRenderer } = require('electron')
const FolderTreeModule = require('./foldertree')

const folderBtn = document.getElementById('folderBtn')
const outlineBtn = document.getElementById('outlineBtn')
const emptyFolderTag = document.getElementById('emptyFolderTag')
const folderView = document.getElementById('folderView')
const mdView = document.getElementById('mdView')
const resize = document.getElementById("resize")

class FolderModule {
    constructor() {
        this.FolderTree = new FolderTreeModule.FolderTreeModule()
        this.isFileClicked = true
        this.isOutlineClicked = false
        this.resizeX = null

        this.folderBtnSelected(true)
        this.setListeners()
    }

    displayFolderTree(tree) {
        // TODO
    }

    openNewFolder() {
        ipcRenderer.send('openNewFolder')
    }

    folderBtnSelected(isFolderSelected) {
        if (isFolderSelected) {
            folderBtn.style.color = '#65655F'
            folderBtn.style.fontWeight = 'bold'
            folderBtn.style.borderBottom = '2px solid #5b5b55'
            emptyFolderTag.innerHTML = 'open a folder'
            outlineBtn.style.color = '#9f9f95'
            outlineBtn.style.fontWeight = 'normal'
            outlineBtn.style.borderBottom = '2px solid transparent'
    
            emptyFolderTag.addEventListener('click', this.openNewFolder)
        } else {
            outlineBtn.style.color = '#65655F'
            outlineBtn.style.fontWeight = 'bold'
            outlineBtn.style.borderBottom = '2px solid #5b5b55'
            emptyFolderTag.innerHTML = 'outline is empty'
            folderBtn.style.color = '#9f9f95'
            folderBtn.style.fontWeight = 'normal'
            folderBtn.style.borderBottom = '2px solid transparent'
    
            emptyFolderTag.removeEventListener('click', this.openNewFolder)
        }
    }

    resizeFolderView(event) {
        let dx = this.resizeX - event.x
        this.resizeX = event.x
        /* new X has to be calculated first, than concatenates with "px", otherwise
           the string will be like newX = "1000+2px" and losing accuracy */
        let folderViewNewX = parseInt(getComputedStyle(folderView, '').width) - dx
        let mdViewNewX = parseInt(getComputedStyle(mdView, '').width) + dx
        folderView.style.width = folderViewNewX + "px"
        mdView.style.width = mdViewNewX + "px"
    }

    setListeners() {

        // ipcRenderer.on('openFile', (event, path, stat) => {
        //     let rawFile = new XMLHttpRequest()
        //     rawFile.open("GET", path, false)
        //     rawFile.onreadystatechange = function () {
        //         if (rawFile.readyState == 4) {
        //             if (rawFile.status == 200 || rawFile.status == 0) {
        //                 let plainText = rawFile.responseText;
        //                 window.vditor.insertValue(plainText, true);
        //             }
        //         }
        //     }
        //     rawFile.send(null)
        // })
        
        ipcRenderer.on('openFolder', (event, path, stat) => {
            let tree = this.FolderTree.getFolderTree(path)
            let treeList = this.FolderTree.getFolderTreeList(tree)
            // Testing
            ipcRenderer.send('test', treeList)
            this.displayFolderTree(tree)
        })
        
        folderBtn.addEventListener('click', () => {
            if (this.isFileClicked == false) {
                this.isFileClicked = true
                this.isOutlineClicked = false
                this.folderBtnSelected(true)
            }
        })

        outlineBtn.addEventListener('click', () => {
            if (this.isOutlineClicked == false) {
                this.isOutlineClicked = true
                this.isFileClicked = false
                this.folderBtnSelected(false)
            }
        })

        resize.addEventListener("mousedown", function (event) {
            this.resizeX = event.x
            document.addEventListener("mousemove", this.resizeFolderView, false)
        }, false)
        
        document.addEventListener("mouseup", function () {
            document.removeEventListener("mousemove", this.resizeFolderView, false)
        }, false)        
    }
}

new FolderModule()

module.exports = { FolderModule }
