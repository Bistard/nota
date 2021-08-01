const { ipcRenderer } = require('electron')

const {readFile, writeFile } = require('fs')

const folderBtn = document.getElementById('folderBtn')
const outlineBtn = document.getElementById('outlineBtn')
const folderView = document.getElementById('folderView')
const folderTree = document.getElementById('folderTree')
const tree = document.getElementById('tree')
const emptyFolderTag = document.getElementById('emptyFolderTag')
const mdView = document.getElementById('mdView')
const resize = document.getElementById("resize")

/**
 * @typedef {import('../folderView/folderTree').TreeNode} TreeNode
 * @typedef {import('../folderView/folderTree').FolderTreeModule} FolderTreeModule
 * @typedef {import('../folderView/tabBar').TabBarModule} TabBarModule
 */

/**
 * @description FolderModule mainly controlling folder/file system. Also 
 * interacts with FolderTreeModule and TabBarModule.
 */
class FolderModule {

    /**
     * @param {FolderTreeModule} FolderTreeModule 
     * @param {TabBarModule} TabBarModule 
     */
    constructor(FolderTreeModule, TabBarModule) {
        this.FolderTree = FolderTreeModule
        this.TabBar = TabBarModule

        this.isFileBtnClicked = true
        this.isOutlineBtnClicked = false
        
        // this variable is to store the x-coordinate of the resizeBar in the 
        // folder view
        this.resizeX = 0

        this.isFolderOpened = false
        this.treeNodeCount = 0

        this.initFolderView()
        this.setListeners()
    }

    /**
     * @description initialize display of folder view.
     * 
     * @return {void} void
     */
    initFolderView() {
        this.folderBtnSelected(true)
        folderTree.removeChild(tree)
    }

    /**
     * @description warpper function for displayTree().
     * 
     * @param {HTMLElement} root 
     * @returns {void} void
     */
    displayFolderTree(root) {
        let current = this.insertNode($('#tree'), root, 'root')
        this.displayTree(current, root.nodes)
    }

    /**
     * @description recursively display the whole folder tree.
     * 
     * @param {TreeNode} parent 
     * @param {TreeNode[]} tree 
     * @returns {void} void
     */
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

    /**
     * @description Initializes a new foler/file node of HTMLElement and inserts
     * into the given parent.
     * 
     * @param {HTMLElement} parent 
     * @param {TreeNode} nodeInfo 
     * @param {string} state root/folder/file
     * @returns {HTMLElement} node
     */
    insertNode(parent, nodeInfo, state) {
        let element;
        if (state == 'root' || state == 'folder') {
            element = document.createElement('ul')
        } else {
            element = document.createElement('li')
        }

        element.classList.add('node')
        let nodeNum = this.treeNodeCount.toString()
        element.setAttribute('nodeNum', nodeNum)
        this.treeNodeCount++

        const text = document.createElement('li')
        text.classList.add('node-text')
        text.innerHTML = nodeInfo.name
        
        if (state == 'file') {
            element.classList.add('node-file')
            text.classList.add('file-icon')
        } else if (state == 'folder' || state == 'root') {
            if (state == 'folder') {
                element.classList.add('node-folder')
            } else {
                element.classList.add('node-root')
                text.classList.add('node-root-text')
            }
            
            if (nodeInfo.isExpand) {
                text.classList.add('folder-icon-expand')
            } else {
                text.classList.add('folder-icon-collapse')
            }  
        }
        
        element.append(text)
        parent.append(element)
        return element
    }

    /**
     * @description Expands or collapses folder in the folder view.
     * 
     * @param {HTMLElement} element 
     * @param {boolean} shouldExpand 
     * @returns {void} void
     */
    expandOrCollapseFolder(element, shouldExpand) {
        if (shouldExpand) {
            element.removeClass('folder-icon-collapse')
            element.addClass('folder-icon-expand')
            element.each(function() {
                element.nextAll().each(function() {
                    $(this).show(0)
                })
            })
        } else {
            element.addClass('folder-icon-collapse')
            element.removeClass('folder-icon-expand')
            element.each(function() {
                element.nextAll().each(function() {
                    $(this).hide(0)
                })
            })
        }
    }

    /**
     * @description wrapper function for left clicking a folder.
     * 
     * @param {HTMLElement} element 
     * @param {TreeNode} nodeInfo 
     * @returns {void} void
     */
    folderLeftClick(element, nodeInfo) {
        nodeInfo.isExpand ^= true
        this.expandOrCollapseFolder(element, nodeInfo.isExpand)
    }

    /**
     * @description wrapper function for left clicking a file.
     * 
     * @param {HTMLElement} element 
     * @param {TreeNode} nodeInfo 
     * @returns {void} void
     */
    // FIX: when open a new or existed file, auto-save will be emit (write the exact same content to the original file)
    fileLeftClick(element, nodeInfo) {
        const tabInfo = this.TabBar.initTab(nodeInfo)
        /**
         * @readonly if 'isExist' is false, 'tabIndex' is set as last one. See
         * more details in TabBarModule.initTab()
         */
        const isExist = tabInfo[0]
        const tabIndex = tabInfo[1]
        const newTab = tabInfo[2]
        
        this.focusFileWhenLeftClick(nodeInfo)

        if (!isExist) {
            this.TabBar.insertTab(newTab, nodeInfo)
        }
        
        if (nodeInfo.plainText !== "") {
            // text is still in the cache
            this.TabBar.openTab(newTab, tabIndex, nodeInfo)
        } else {
            // never opened before, read the file
            this.openFile(newTab, tabIndex, nodeInfo)
        }

    }

    /**
     * @description open the given file and calls TabBarModule.openTab().
     * 
     * @param {HTMLElement} newTab
     * @param {number} tabIndex
     * @param {TreeNode} nodeInfo 
     * @returns {Void} void
     */
    openFile(newTab, tabIndex, nodeInfo) {
        readFile(nodeInfo.path, 'utf-8', (err, text) => {
            if (err) {
                throw err
            }
            nodeInfo.plainText = text
            this.TabBar.openTab(newTab, tabIndex, nodeInfo)
        })
    }

    /**
     * @description write the current focused tab's content into the file.
     * 
     * @param {TreeNode} nodeInfo 
     * @param {string} newText
     * @return {void} void
     */
    saveFile(nodeInfo, newText) {

        if (nodeInfo !== undefined) {
            writeFile(nodeInfo.path, newText, (err) => {
                if (err) {
                    throw err
                }
                ipcRenderer.send('test', 'auto saved')
            })
        } else {
            ipcRenderer.send('test', 'auto saved but undefined')
        }
    }

    /**
     * @description display focus on the given tab.
     * 
     * @param {TreeNode} nodeInfo 
     * @returns {void} void
     */
    focusFileWhenLeftClick(nodeInfo) {
        // TODO: complete
    }

    /**
     * @readonly Since remote is deprecated and dialog can only be used in the 
     * main process, to communicate between main process and renderer is to use 
     * ipcRenderer and ipcMain. See more details about Electron/remote on 
     * https://www.electronjs.org/docs/api/remote
     */
     sendOpenDirMsg() {
        ipcRenderer.send('openDir')
    }

    /**
     * @description Opennign a directory and it does the following things:
     *  - displays the whole folder tree.
     *  - set each TreeNode a click listeners.
     *  - if clicked, check if is foler or file, calls the corresponding click function.
     * 
     * @param {string} path 
     * @returns {void} void
     */
    openDirecory(path) {
        this.isFolderOpened = true
        this.FolderTree.tree = this.FolderTree.createFolderTree(path, 0)
        this.FolderTree.treeList = this.FolderTree.createFolderTreeList(this.FolderTree.tree)

        folderTree.removeChild(emptyFolderTag)
        folderTree.appendChild(tree)
        this.displayFolderTree(this.FolderTree.tree)

        $('.node-text').on('click', { folderViewClass: this }, function (event) {
            let that = event.data.folderViewClass
            let nodeNum = this.parentNode.getAttribute('nodeNum')
            let nodeInfo = that.FolderTree.treeList[parseInt(nodeNum)]
            if (nodeInfo.isFolder) {
                that.folderLeftClick($(this), nodeInfo)
            } else { 
                that.fileLeftClick($(this), nodeInfo)
            }
        })
    }

    /**
     * @description helper functions for creating string-formatted .css style 
     * for folderIcon usage
     * 
     * @param {string} fileName 
     * @returns {string} string-formatted .css style
     */
    createfolderIconString(fileName) {
        return "<style>.node-text::before {content: url('assets/icons/" + fileName + "');display: inline-block;width: 10px;height: 10px;margin-left: 4px;margin-right: 4px;}</style>"
    }
    
    /**
     * @description callback functions for resize folder view.
     * 
     * @param {MouseEvent} event 
     * @returns {void} void
     */
    resizeFolderView(event) {

        // minimum width for folder view to be resized
        if (event.x < 100)
            return
        
        let dx = this.resizeX - event.x
        this.resizeX = event.x
        /* new X has to be calculated first, than concatenates with "px", otherwise
           the string will be like newX = "1000+2px" and losing accuracy */
        let folderViewNewX = parseInt(getComputedStyle(folderView, '').width) - dx
        let mdViewNewX = parseInt(getComputedStyle(mdView, '').width) + dx
        
        folderView.style.width = folderViewNewX + "px"
        folderView.style.minWidth = folderViewNewX + "px"
        mdView.style.width = mdViewNewX + "px"
    }

    /**
     * @description set which button is selected. Function will be called at 
     * first time when FolderModule is instantiated.
     * 
     * @param {boolean} isFolderSelected 
     * @returns {void} void
     */
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
            emptyFolderTag.addEventListener('click', this.sendOpenDirMsg)
        } else {
            outlineBtn.style.color = '#65655F'
            outlineBtn.style.fontWeight = 'bold'
            outlineBtn.style.borderBottom = '2px solid #5b5b55'
            emptyFolderTag.innerHTML = 'outline is empty'
            folderBtn.style.color = '#9f9f95'
            folderBtn.style.fontWeight = 'normal'
            folderBtn.style.borderBottom = '2px solid transparent'

            folderView.removeChild(folderTree)
            emptyFolderTag.removeEventListener('click', this.sendOpenDirMsg)
        }
    }
    
    /**
     * @description set folder event listeners.
     * 
     * @returns {void} void
     */
     setListeners() {

        // set openDir listener to get response back from main.js
        ipcRenderer.on('openDir', (event, path, stat) => {
            this.openDirecory(path)
        })

        /**
         * @readonly button event listensers
         */

        folderBtn.addEventListener('click', () => {
            if (this.isFileBtnClicked == false) {
                this.isFileBtnClicked = true
                this.isOutlineBtnClicked = false
                this.folderBtnSelected(true)
            }
        })

        outlineBtn.addEventListener('click', () => {
            if (this.isOutlineBtnClicked == false) {
                this.isOutlineBtnClicked = true
                this.isFileBtnClicked = false
                this.folderBtnSelected(false)
            }
        })

        // folder view resizeBar listeners
        resize.addEventListener("mousedown", (event) => {
            this.resizeX = event.x
            document.addEventListener("mousemove", this.resizeFolderView, false)
        }, false)

        document.addEventListener("mouseup", () => {
            document.removeEventListener("mousemove", this.resizeFolderView, false)
        }, false)
    }

}

module.exports = { FolderModule }
