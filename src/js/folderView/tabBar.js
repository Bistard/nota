const { app, ipcRenderer } = require("electron")

class TabBarModule {
    constructor() {
        this.emptyTab = true
        this.openedTabCount = 0
        this.openedTabInfo = []
        this.currFocusTabIndex = -1
        this.setListeners()
    }

    initTab(nodeInfo) {
        for (let i = 0; i < this.openedTabCount; i++) {
            if (nodeInfo.path == this.openedTabInfo[i].path) {
                return null
            }
        }

        const newTab = document.createElement('div')
        newTab.classList.add('tab')
        this.focusTab(newTab)

        newTab.addEventListener('click', () => {
            this.focusTab(newTab)
            this.openTab(nodeInfo)
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
        
        return newTab
    }

    insertTab(element, nodeInfo) {
        $('#tabBar-container').append(element)
        this.currFocusTabIndex = this.openedTabCount
        this.openedTabCount++
        this.emptyTab = false
        this.openedTabInfo.push(nodeInfo)
    }

    focusTab(tab) {
        // TODO: improve efficiency
        $('.tab').each(function() {
            $(this).removeClass('tab-clicked')
        })
        tab.classList.add('tab-clicked')
        // TODO: calling openTab() here
    }

    openTab() {
        //TODO: complete
    }

    closeTab(element, nodeInfo) {
        ipcRenderer.send('test', this.currFocusTabIndex)
        const tabBar = document.getElementById('tabBar-container')
        tabBar.removeChild(element)
        
        this.openedTabCount--
        if (this.openedTabCount == 0) {
            this.emptyTab = true
        }

        let index = this.openedTabInfo.indexOf(nodeInfo)
        this.openedTabInfo.splice(index, 1)

        if (index == this.currFocusTabIndex) {
            this.currFocusTabIndex = --index
            const nextFocusTab = tabBar.childNodes[index]
            this.focusTab(nextFocusTab)
        } else if (index < this.currFocusTabIndex) {
            this.currFocusTabIndex--
        }
        
    }

    setListeners() {
        
        // able to scroll horizontally using middle mouse
        const tabBar = document.getElementById('tabBar-container')
        tabBar.addEventListener('wheel', (event) => {
            tabBar.scrollLeft += event.deltaY
        })

        // shortcut handling
        ipcRenderer.on('Ctrl+Tab', () => {
            
        })

        ipcRenderer.on('Ctrl+Shift+Tab', () => {
            
        })

    }
}

module.exports = { TabBarModule }