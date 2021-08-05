const ConfigModule = require('./js/config')
const ActionViewModule = require('./js/actionView/actionView')
const ActionBarModule = require('./js/actionBar/actionBar')
const FolderTreeModule = require('./js/actionView/folderView/folderTree')
const FolderModule = require('./js/actionView/folderView/folder')
const TitleBarModule = require('./js/content/titleBar/titleBar')
const TabBarModule = require('./js/actionView/folderView/tabBar')
const MarkdownModule = require('./js/content/markdown/markdown')

/**
 * @description this module is loaded by the web directly. Most of the modules 
 * are instantiating in here. Also convinents for passing diferent modules into
 * others.
 */
class mainMoudle {

    constructor() {
        this.Config = new ConfigModule.ConfigModule()
        this.ActionView = new ActionViewModule.ActionViewModule()
        this.ActionBar = new ActionBarModule.ActionBarModule(this.ActionView)
        this.FolderTree = new FolderTreeModule.FolderTreeModule()
        this.TabBar = new TabBarModule.TabBarModule(this.Config)
        this.Folder = new FolderModule.FolderModule(this.FolderTree, this.TabBar)
        this.Markdown = new MarkdownModule.MarkdownModule(this.Config, this.Folder)
        this.TitleBar = new TitleBarModule.TitleBarModule(this.Config, this.Markdown)
    }

}

// since it is loaded by the web which is sepreated by the main.js, it needs to 
// be instantiated individually.
new mainMoudle()

