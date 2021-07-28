const { ipcRenderer } = require('electron')
const FolderTreeModule = require('./foldertree')

const folderBtn = document.getElementById('folderBtn')
const outlineBtn = document.getElementById('outlineBtn')
const folderView = document.getElementById('folderView')
const folderTree = document.getElementById('folderTree')
const tree = document.getElementById('tree')
const emptyFolderTag = document.getElementById('emptyFolderTag')
const mdView = document.getElementById('mdView')
const resize = document.getElementById("resize")

class FolderModule {
    
    constructor() {
        this.FolderTree = new FolderTreeModule.FolderTreeModule()

        this.isFileClicked = true
        this.isOutlineClicked = false
        this.resizeX = null

        this.isFolderOpened = false
        this.treeNodeCount = 0

        this.initFolderView()
        this.setListeners()
    }

    initFolderView() {
        this.folderBtnSelected(true)
        folderTree.removeChild(tree)
    }

    displayFolderTree(root) {
        let current = this.insertNode($('#tree'), root, 'root')
        this.displayTree(current, root.nodes)
    }

    displayTree(parent, tree) {
        for (const [name, node] of Object.entries(tree)) {
            if (node.isFolder) {
                let current = this.insertNode(parent, node, 'folder')
                this.displayTree(current, node.nodes)
            } else {
                this.insertNode(parent, node, 'file')
            }
        }
    }

    insertNode(parent, node, state) {
        const element = document.createElement('div')
        const icon = document.createElement('img')
        const text = document.createElement('div')
        
        element.classList.add('node')
        
        let nodeNum = this.treeNodeCount.toString()
        element.setAttribute('nodeNum', nodeNum)
        this.treeNodeCount++

        icon.classList.add('node-icon')
        text.classList.add('node-text')
        text.innerHTML = node.baseName

        if (state == 'file') {
            element.classList.add('is-file')
            icon.src = 'assets/icons/file.svg'
        } else if (state == 'folder' || state == 'root') {
            if (node.isExpand) {
                icon.src = 'assets/icons/angle-down.svg'    
            } else {
                icon.src = 'assets/icons/angle-right.svg'
            }
            
            if (state == 'folder') {
                element.classList.add('is-folder')
            } else {
                element.classList.add('is-root')
            }
        }

        element.appendChild(icon)
        element.appendChild(text)
        parent.append(element)
        return element
    }

    changeExpandStatus(node){
        var elements = [];
        $(node).each(function(){
            elements.push($(node).nextAll());
        });

        for (var i = 0; i < elements.length; i++) {
            if (elements[i].css('display') == 'none'){
                elements[i].fadeIn(0);
            }else{
                elements[i].fadeOut(0);
            }
        }
        
        if (elements[0].css('display') != 'none') {
            $(node).addClass('active');
        }else{
            $(node).removeClass('active');
        }
    }

    nodeLeftClicked(htmlElement, node) {
        node.isExpand ^= true

        changeExpandStatus(htmlElement)
        
        /* ipcRenderer.send('test', node) */
    }

    expandFolder(node) {
        this.FolderTree.expandFolder(node)

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
    
            folderView.appendChild(folderTree)
            emptyFolderTag.addEventListener('click', this.openNewFolder)
        } else {
            outlineBtn.style.color = '#65655F'
            outlineBtn.style.fontWeight = 'bold'
            outlineBtn.style.borderBottom = '2px solid #5b5b55'
            emptyFolderTag.innerHTML = 'outline is empty'
            folderBtn.style.color = '#9f9f95'
            folderBtn.style.fontWeight = 'normal'
            folderBtn.style.borderBottom = '2px solid transparent'
    
            folderView.removeChild(folderTree)
            emptyFolderTag.removeEventListener('click', this.openNewFolder)
        }
    }

    openNewFolder() {
        ipcRenderer.send('openNewFolder')
    }

    resizeFolderView(event) {
        if (event.x < 100)
            return
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
            this.isFolderOpened = true
            this.FolderTree.tree = this.FolderTree.createFolderTree(path, 0)
            this.FolderTree.treeList = this.FolderTree.getFolderTreeList(this.FolderTree.tree)
            
            folderTree.removeChild(emptyFolderTag)
            folderTree.appendChild(tree)
            this.displayFolderTree(this.FolderTree.tree)

            $('.node').click({folderViewClass: this}, function(event) {
                let that = event.data.folderViewClass

                let nodeNum = this.getAttribute('nodeNum')
                let node = that.FolderTree.treeList[parseInt(nodeNum)]
                that.nodeLeftClicked($(this), node)
            })
            // Array.from(document.getElementsByClassName('node')).forEach((element) => {
            //     let nodeNum = element.getAttribute('nodeNum')
            //     let node = this.FolderTree.treeList[parseInt(nodeNum)]
            //     element.addEventListener('click', () => {
            //         this.nodeLeftClicked(node)
            //     })
            // })
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

        resize.addEventListener("mousedown", (event) => {
            this.resizeX = event.x
            document.addEventListener("mousemove", this.resizeFolderView, false)
        }, false)
        
        document.addEventListener("mouseup", () => {
            document.removeEventListener("mousemove", this.resizeFolderView, false)
        }, false)
    }
}

new FolderModule()

module.exports = { FolderModule }
