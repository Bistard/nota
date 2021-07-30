const { ipcRenderer } = require("electron")

class TabBarModule {
    constructor() {
        this.emptyTab = true
        this.tabOpenedCount = 0
        this.openedTabInfo = []
    }

    initTab(nodeInfo) {
        for (let i = 0; i < this.tabOpenedCount; i++) {
            
        }

        const newTab = document.createElement('div')
        newTab.classList.add('tab')
        if (this.emptyTab) {
            newTab.classList.add('tab-clicked')
            this.emptyTab = false
        }
        newTab.addEventListener('click', () => {
            $('.tab').each(function() {
                $(this).removeClass('tab-clicked')
            })
            newTab.classList.add('tab-clicked')
            // TODO: display on vditor
        })

        const tabText = document.createElement('div')
        const tabCloseIcon = document.createElement('img')
        tabCloseIcon.addEventListener('click', () => {
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
        $('#tabBar').append(element)
        this.tabOpenedCount++
        this.emptyTab = false
        this.openedTabInfo.push(nodeInfo)
        ipcRenderer.send('test', this.openedTabInfo)
    }

    closeTab(element, nodeInfo) {
        document.getElementById('tabBar').removeChild(element)
        this.tabOpenedCount--
        if (this.tabOpenedCount == 0) {
            this.emptyTab = true
        }

        let index = this.openedTabInfo.indexOf(nodeInfo)
        this.openedTabInfo.splice(index, 1)
        ipcRenderer.send('test', this.openedTabInfo)
    }
}

module.exports = { TabBarModule }