import { ConfigModule } from "./code/config.js";
import { ActionViewModule } from "./code/actionView/actionView.js";
import { ActionBarModule } from "./code/actionBar/actionBar.js";
import { FolderTreeModule } from "./code/actionView/folderView/foldertree.js";
import { TabBarModule } from "./code/actionView/folderView/tabBar.js";
import { FolderModule } from "./code/actionView/folderView/folder.js"
// import { MarkdownModule } from "./content/markdown/markdown.js"
// import { TitleBarModule } from "./content/titleBar/titleBar.js"

/**
 * @description this module is loaded by the web directly. Most of the modules 
 * are instantiating in here. Also convinents for passing diferent modules into
 * others.
 */
class mainMoudle {

    Config: ConfigModule;
    ActionView: ActionViewModule;
    ActionBar: ActionBarModule;
    FolderTree: FolderTreeModule;
    TabBar: TabBarModule;
    Folder: FolderModule;
    // Markdown: MarkdownModule;
    // TitleBar: TitleBarModule;

    constructor() {
        this.Config = new ConfigModule();
        this.ActionView = new ActionViewModule();
        this.ActionBar = new ActionBarModule(this.ActionView);
        this.FolderTree = new FolderTreeModule();
        this.TabBar = new TabBarModule(this.Config);
        this.Folder = new FolderModule(this.FolderTree, this.TabBar);
        // this.Markdown = new MarkdownModule(this.Config, this.Folder);
        // this.TitleBar = new TitleBarModule(this.Config, this.Markdown);
    }

}

// since it is loaded by the web which is sepreated by the main.js, it needs to 
// be instantiated individually.
new mainMoudle();

