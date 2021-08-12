import { ConfigModule } from "src/base/config";
import { ActionViewModule } from "src/code/workbench/actionView/actionView";
import { ActionBarModule } from "src/code/workbench/actionBar/actionBar";
import { FolderTreeModule } from "src/code/workbench/actionView/folderView/foldertree";
import { TabBarModule } from "src/code/workbench/actionView/folderView/tabBar";
import { FolderModule } from "src/code/workbench/actionView/folderView/folder";
import { MarkdownModule } from "src/code/workbench/content/markdown/markdown";
import { TitleBarModule } from "src/code/workbench/content/titleBar/titleBar";

/**
 * @description this module is loaded by the web directly. Most of the modules 
 * are instantiating in here. Also convinents for passing diferent modules into
 * others.
 */
class WorkbenchModule {

    Config: ConfigModule;
    ActionView: ActionViewModule;
    ActionBar: ActionBarModule;
    FolderTree: FolderTreeModule;
    TabBar: TabBarModule;
    Folder: FolderModule;
    Markdown: MarkdownModule;
    TitleBar: TitleBarModule;

    constructor() {
        this.Config = new ConfigModule();
        this.ActionView = new ActionViewModule();
        this.ActionBar = new ActionBarModule(this.ActionView);
        this.FolderTree = new FolderTreeModule();
        this.TabBar = new TabBarModule(this.Config);
        this.Folder = new FolderModule(this.FolderTree, this.TabBar);
        this.Markdown = new MarkdownModule(this.Config, this.Folder);
        this.TitleBar = new TitleBarModule(this.Config, this.Markdown);
    }

}

// since it is loaded by the web which is sepreated by the main.js, it needs to 
// be instantiated individually.
new WorkbenchModule();

