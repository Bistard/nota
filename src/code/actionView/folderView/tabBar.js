const { ipcRenderer } = require("electron")

const {readFile, writeFile } = require('fs')

const tabBar = document.getElementById('tabBar')

/**
 * @typedef {import('./foldertree').TreeNode} TreeNode
 * @typedef {import('../../config').ConfigModule} ConfigModule
 */

/**
 * @description TabBarModule stores all the opened tabs data and handles all the 
 * tabBar relevant listeners.
 * business.
 */
class TabBarModule {

    /**
     * @param {ConfigModule} ConfigModule 
     */
    constructor(ConfigModule) {

        this.Config = ConfigModule
        this.emptyTab = true
        this.openedTabCount = 0
        
        /**
         * Array to store all the opened tab information using class TreeNode.
         * 
         * @type {TreeNode[]}
         */
        this.openedTabInfo = []
        
        this.currFocusTabIndex = -1
        
        this.setListeners()
    }

    /**
     * @description By the given TreeNode, initializes a new HTMLElement tab 
     * and sets 'click' listeners. The 1st return value indicates if the tab is
     * already opened. The following return values indicates its coressponding 
     * information.
     * 
     * @param {TreeNode} nodeInfo 
     * @returns {[boolean, number, HTMLElement]} [isExist, exsistedIndex, tab]
     */
    initTab(nodeInfo) {

        // loop to search if the tab is existed or not
        let i = 0
        for (i = 0; i < this.openedTabCount; i++) {
            if (nodeInfo.path == this.openedTabInfo[i].path) {
                // tab exists
                return [true, i, tabBar.childNodes[i]]
            }
        }

        // initializes a new HTMLElement tab
        const newTab = document.createElement('div')
        const tabText = document.createElement('div')
        const tabCloseIcon = document.createElement('img')
        
        newTab.classList.add('tab')
        tabText.classList.add('tab-text')
        tabText.innerHTML = nodeInfo.name
        tabCloseIcon.classList.add('tab-close-icon')
        tabCloseIcon.classList.add('vertical-center')

        newTab.append(tabText)
        newTab.append(tabCloseIcon)

        /// when the tab is clicked, switch to that tab
        newTab.addEventListener('click', () => {
            let index = this.openedTabInfo.indexOf(nodeInfo)
            this.openTab(newTab, index, nodeInfo)
        })

        // close tab listeners
        tabCloseIcon.addEventListener('click', (event) => {
            // prevent parent click when clicked on child
            event.stopPropagation()
            this.closeTab(newTab, nodeInfo)
        })
        
        // the tab is not opened, newTab will be inserted at the end of the 
        // tabBar
        return [false, i, newTab]
    }

    /**
     * @description Given a HTMLElement, inserts it into the tabBar.
     * 
     * @param {HTMLElement} element the tab to be inserted
     * @param {TreeNode} nodeInfo tabInfo
     * @returns {void} void
     */
    insertTab(element, nodeInfo) {
        $('#tabBar').append(element)
        this.currFocusTabIndex = this.openedTabCount
        this.openedTabCount++
        this.emptyTab = false
        this.openedTabInfo.push(nodeInfo)
    }

    /**
     * @description Given a HTMLElement, switches to that tab and displays its 
     * content on the markdown view.
     * 
     * @param {HTMLElement} tab tab to be opened
     * @param {number} index index in the tabBar
     * @param {TreeNode} nodeInfo tabInfo
     * @returns {void} void
     */
    openTab(tab, index, nodeInfo) {
        // TODO: improve efficiency
        $('.tab').each(function() {
            $(this).removeClass('tab-clicked')
        })
        tab.classList.add('tab-clicked')
        
        this.currFocusTabIndex = index
        this.displayTab(nodeInfo)
    }

    /**
     * @description displays a new string content onto the markdown view.
     * 
     * @param {TreeNode} nodeInfo 
     * @returns {void} void
     */
    displayTab(nodeInfo) {
        // setMarkdown() will emit Editor.event.change callback
        // ipcRenderer.send('test', 'setMarkdown()')
        window.editor.setMarkdown(nodeInfo.plainText, false)
    }

    /**
     * @description Given a HTMLElement, close that given tab. Switches to the 
     * next avaliable tab and displays its content.
     * 
     * If auto-save is on, current changes will be async auto-saved.
     * If auto-save is off, closing tab will pop up a warning to warn you to save or not.
     * 
     * @param {HTMLElement} element 
     * @param {TreeNode} nodeInfo 
     * @returns {void} void
     */
    closeTab(element, nodeInfo) {
        
        tabBar.removeChild(element)

        // save current change immediately
        if (this.Config.fileAutoSaveOn) {
            /**
             * TODO: currently, written texts are from nodeInfo.plainText. If we decide to use 
             * mutiple threads for each tab, the texts should read from window.editor.getMarkdown()
             */

            let writeOption = {
                encoding: 'utf-8',
                flag: 'w'
            }
            // FIX: shouldn't be nodeInfo.plainText, 
            writeFile(nodeInfo.path, nodeInfo.plainText, writeOption, (err) => {
                if (err) {
                    throw err
                }
                ipcRenderer.send('test', 'close saved')
            })
        } else {
            // pop up a warning window
            // TODO: complete
        }
        nodeInfo.plainText = ''
        let index = this.openedTabInfo.indexOf(nodeInfo)
        this.openedTabInfo.splice(index, 1)
        
        this.openedTabCount--
        if (this.openedTabCount == 0) {
            this.emptyTab = true
            this.currFocusTabIndex = -1
            this.displayTab('')
            return
        }

        if (index == this.currFocusTabIndex) {
            if (index == this.openedTabCount) {
                index--
            }
            const nextFocusTab = tabBar.childNodes[index]
            const nextFocustabInfo = this.openedTabInfo[index]
            this.openTab(nextFocusTab, index, nextFocustabInfo)
        } else if (index < this.currFocusTabIndex) {
            this.currFocusTabIndex--
        }
    }

    /**
     * @description setup tabBar relevant listeners.
     * 
     * @returns {void} void
     */
    setListeners() {
        
        // able to scroll horizontally using middle mouse
        tabBar.addEventListener('wheel', (event) => {
            tabBar.scrollLeft += event.deltaY
        })

        // switch tab forwards
        ipcRenderer.on('Ctrl+Tab', () => {
            if (!this.emptyTab && this.openedTabCount != 1) {
                const index = (this.currFocusTabIndex + 1) % this.openedTabCount
                const tab = tabBar.children[index]
                let nodeInfo = this.openedTabInfo[index]
                this.openTab(tab, index, nodeInfo)
            }
        })

        // switch tab backwards
        ipcRenderer.on('Ctrl+Shift+Tab', () => {
            if (!this.emptyTab && this.openedTabCount != 1) {
                const index = (this.currFocusTabIndex - 1 + this.openedTabCount) % this.openedTabCount
                const tab = tabBar.children[index]
                let nodeInfo = this.openedTabInfo[index]
                this.openTab(tab, index, nodeInfo)
            }
        })

        // close current focused tab
        ipcRenderer.on('Ctrl+W', () => {
            if (!this.emptyTab) {
                const tab = tabBar.children[this.currFocusTabIndex]
                let nodeInfo = this.openedTabInfo[this.currFocusTabIndex]
                this.closeTab(tab, nodeInfo)
            }
        })

    }
}

module.exports = { TabBarModule }