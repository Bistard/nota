const { ipcRenderer } = require("electron")

class TabBarModule {
    constructor() {
        this.emptyTab = true
        this.tabOpenedCount = 0
        this.openedTabInfo = []
        this.setListeners()
    }

    initTab(nodeInfo) {
        for (let i = 0; i < this.tabOpenedCount; i++) {
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
        this.tabOpenedCount++
        this.emptyTab = false
        this.openedTabInfo.push(nodeInfo)
    }

    focusTab(tab) {
        $('.tab').each(function() {
            $(this).removeClass('tab-clicked')
        })
        tab.classList.add('tab-clicked')
    }

    openTab() {
        //TODO: complete
    }

    closeTab(element, nodeInfo) {
        document.getElementById('tabBar-container').removeChild(element)
        this.tabOpenedCount--
        if (this.tabOpenedCount == 0) {
            this.emptyTab = true
        }

        let index = this.openedTabInfo.indexOf(nodeInfo)
        this.openedTabInfo.splice(index, 1)
    }

    setListeners() {
        const tabBar = document.getElementById('tabBar-container')
        tabBar.addEventListener('wheel', (event) => {
            tabBar.scrollLeft += event.deltaY
        })
    }
}

module.exports = { TabBarModule }