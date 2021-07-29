
class TabBarModule {
    constructor() {
        this.emptyTab = true
        this.tabOpenedCount = 0
    }

    initTab(nodeInfo) {
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
        })

        const tabText = document.createElement('div')
        const tabCloseIcon = document.createElement('img')
        tabCloseIcon.addEventListener('click', function() {
            // TODO: close tab
        })
        
        tabText.classList.add('tab-text')
        tabText.innerHTML = nodeInfo.name
        tabCloseIcon.classList.add('tab-close-icon')
        tabCloseIcon.classList.add('vertical-center')

        newTab.append(tabText)
        newTab.append(tabCloseIcon)
        
        return newTab
    }

    insertTab(element) {
        $('#tabBar').append(element)
    }

    closeTab(index) {

    }
}

module.exports = { TabBarModule }