const ConfigModule = require('./js/config')
const TitleBarModule = require('./js/titleBar/titleBar')
const FolderTreeModule = require('./js/folderView/folderTree')
const TabBarModule = require('./js/folderView/tabBar')
const FolderModule = require('./js/folderView/folder')
const MarkdownModule = require('./js/markdown/markdown')

/**
 * @description this module is loaded by the web directly. Most of the modules 
 * are instantiating in here. Also convinents for passing diferent modules into
 * others.
 */
class mainMoudle {

    constructor() {
        this.Config = new ConfigModule.ConfigModule()
        this.TitleBar = new TitleBarModule.TitleBarModule()
        this.FolderTree = new FolderTreeModule.FolderTreeModule()
        this.TabBar = new TabBarModule.TabBarModule()
        this.Folder = new FolderModule.FolderModule(this.FolderTree, this.TabBar)
        this.Markdown = new MarkdownModule.MarkdownModule(this.Folder)
    }

}

// since it is loaded by the web which is sepreated by the main.js, it needs to 
// be instantiated individually.
new mainMoudle()

