const TitleBarModule = require('./js/titleBar/titleBar')
const FolderModule = require('./js/folderView/folder')
const MarkdownModule = require('./js/markdown/markdown')

class mainMoudle {
    constructor() {
        this.TitleBar = new TitleBarModule.TitleBarModule()
        this.Folder = new FolderModule.FolderModule()
        this.Markdown = new MarkdownModule.MarkDownModule()
    }
}

new mainMoudle()

