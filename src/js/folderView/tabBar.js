const { app, ipcRenderer } = require("electron")

const tabBar = document.getElementById('tabBar-container')
class TabBarModule {
    constructor() {
        this.emptyTab = true
        this.openedTabCount = 0
        this.openedTabInfo = []
        this.currFocusTabIndex = -1
        this.setListeners()
    }

    initTab(nodeInfo) {
        let i = 0
        for (i = 0; i < this.openedTabCount; i++) {
            if (nodeInfo.path == this.openedTabInfo[i].path) {
                return [true, i, tabBar.childNodes[i]]
            }
        }

        const newTab = document.createElement('div')
        newTab.classList.add('tab')
        
        newTab.addEventListener('click', () => {
            let index = this.openedTabInfo.indexOf(nodeInfo)
            this.openTab(newTab, index, nodeInfo)
        })

        const tabText = document.createElement('div')
        const tabCloseIcon = document.createElement('img')
        tabCloseIcon.addEventListener('click', (event) => {
            event.stopPropagation() // prevent parent click when clicked on child
            this.closeTab(newTab, nodeInfo)
        })
        
        tabText.classList.add('tab-text')
        tabText.innerHTML = nodeInfo.name
        tabCloseIcon.classList.add('tab-close-icon')
        tabCloseIcon.classList.add('vertical-center')

        newTab.append(tabText)
        newTab.append(tabCloseIcon)
        
        return [false, i, newTab]
    }

    insertTab(element, nodeInfo) {
        $('#tabBar-container').append(element)
        this.currFocusTabIndex = this.openedTabCount
        this.openedTabCount++
        this.emptyTab = false
        this.openedTabInfo.push(nodeInfo)
    }

    openTab(tab, index, nodeInfo) {
        // TODO: improve efficiency
        $('.tab').each(function() {
            $(this).removeClass('tab-clicked')
        })
        tab.classList.add('tab-clicked')
        
        this.currFocusTabIndex = index
        this.displayTab(tab, nodeInfo)
    }

    displayTab(netTab, nodeInfo) {
        window.editor.setMarkdown(nodeInfo.plainText, false)
    }

    closeTab(element, nodeInfo) {
        
        tabBar.removeChild(element)
        
        this.openedTabCount--
        if (this.openedTabCount == 0) {
            this.emptyTab = true
            this.currFocusTabIndex = -1
            this.displayTab(null, '')
            return
        }

        let index = this.openedTabInfo.indexOf(nodeInfo)
        this.openedTabInfo.splice(index, 1)
        
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

    setListeners() {
        
        // able to scroll horizontally using middle mouse
        tabBar.addEventListener('wheel', (event) => {
            tabBar.scrollLeft += event.deltaY
        })

        // shortcut handling
        ipcRenderer.on('Ctrl+Tab', () => {
            if (!this.emptyTab && this.openedTabCount != 1) {
                const index = (this.currFocusTabIndex + 1) % this.openedTabCount
                const tab = tabBar.childNodes[index]
                let nodeInfo = this.openedTabInfo[index]
                this.openTab(tab, index, nodeInfo)
            }
        })

        ipcRenderer.on('Ctrl+Shift+Tab', () => {
            if (!this.emptyTab && this.openedTabCount != 1) {
                const index = (this.currFocusTabIndex - 1 + this.openedTabCount) % this.openedTabCount
                const tab = tabBar.childNodes[index]
                let nodeInfo = this.openedTabInfo[index]
                this.openTab(tab, index, nodeInfo)
            }
        })

        ipcRenderer.on('Ctrl+W', () => {

        })

        ipcRenderer.on('Ctrl+S', () => {
            
        })
    }
}

module.exports = { TabBarModule }