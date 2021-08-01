const { ipcRenderer } = require("electron")

const TitleBarModule = require('./js/titleBar/titleBar')
const FolderTreeModule = require('./js/folderView/folderTree')
const TabBarModule = require('./js/folderView/tabBar')
const FolderModule = require('./js/folderView/folder')
const MarkdownModule = require('./js/markdown/markdown')

class mainMoudle {

    constructor() {
        this.TitleBar = new TitleBarModule.TitleBarModule()
        this.FolderTree = new FolderTreeModule.FolderTreeModule()
        this.TabBar = new TabBarModule.TabBarModule()
        this.Folder = new FolderModule.FolderModule(this.FolderTree, this.TabBar)
        this.Markdown = new MarkdownModule.MarkDownModule(this.Folder)
    }

}

new mainMoudle()

