// @toast-ui: see more details on this library: https://github.com/nhn/tui.editor#-packages
import Editor from '@toast-ui/editor';

// @toast-ui: language pack require
/* require('../../../node_modules/@toast-ui/editor/dist/i18n//zh-cn') */

// @toast-ui-plugin: code syntax highlight (all languages pack are loaded here)
import Prism from 'prismjs';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';

// @toast-ui-plugin: import language files of Prism.js that you need
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';

// @toast-ui-plugin: color syntax 
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import { ConfigModule } from 'src/base/config';
import { FolderModule } from 'src/base/browser/ui/actionView/folderView/folder';
import { TreeNode } from 'src/base/browser/ui/actionView/folderView/foldertree';
import { ipcRendererOn } from 'src/base/ipc/register';

/**
 * @description MarkdownModule initializes markdown renderer and windows and
 * handling a few other shortcuts as well.
 */
export class MarkdownModule {
    
    Config: ConfigModule;
    Folder: FolderModule;

    editor: Editor | null;

    saveFileTimeout: NodeJS.Timeout | null;

    colorSyntaxOptions: any;

    constructor(ConfigModule: ConfigModule, FolderModule: FolderModule) {
        this.Config = ConfigModule;
        this.Folder = FolderModule;

        this.editor = null;
        
        /**
         * after markdown content is changed, a timeout will be set when the 
         * auto-save mode is turned on. When the time has arrived, file will be
         * auto saved.
         */
        this.saveFileTimeout = null;

        /**
         * The object is a preset color choices for color-syntax plugin.
         */
        this.colorSyntaxOptions = {
            preset: ['#ff0000', // red
                     '#ff8f00', // orange
                     '#fff600', // yellow
                     '#52ff00', // green
                     '#007dff', // blue
                     '#5200ff', // indigo
                     '#ad00ff'] // violet
        };

        this.createMarkdownEditor();
        this.setListeners();
    }

    /**
     * @description instantiates editor constructor and markdown view. Editor's
     * events's callback functions will also be set here.
     */
    createMarkdownEditor(): void {

        let editor = new Editor({
            el: document.getElementById('md') as HTMLElement, // HTMLElement container for md editor
            height: '100%',
            language: 'en-US',
            /**
             * @argument 'tab'
             * @argument 'vertical'
             */
            previewStyle: 'vertical',
            previewHighlight: false,
            useCommandShortcut: true,
            usageStatistics: true,      // send hostname to google analytics
            hideModeSwitch: true,
            /**
             * @argument 'wysiwyg' = 'what you see is what you get'
             * @argument 'markdown'
             */
            initialEditType: 'wysiwyg', 
            /**
             * @readonly this 'events' attribute handles callback functions to 
             * serval editor events.
             * 
             * @member load
             * @member change
             * @member focus
             * @member blur
             * @member keydown
             * @member keyup
             */
            events: {
                /**
                 * @readonly It would be emitted when content changed.
                 */
                change: () => { this.onChange() },
            },
            placeholder: 'type your magic word...',
            plugins: [
                [codeSyntaxHighlight, { highlighter: Prism }],
                [colorSyntax, this.colorSyntaxOptions]
            ],
        })

        

        editor.getMarkdown();
        this.editor = editor;
        (window as any).editor = editor; // set as global value

        // spellcheck config check
        if (!this.Config.markdownSpellCheckOn) {
            const md = document.getElementById('md') as HTMLElement;
            md.setAttribute('spellcheck', 'false');
        }

    }

    /**
     * @description callback function for 'editor.event.change'.
     */
    onChange(): void {
        // check if file-auto-save is ON
        if (this.Config.fileAutoSaveOn) {
            // if content is changed before the previous timeout has 
            // reached, clear the preivous one.
            if (this.saveFileTimeout) {
                clearTimeout(this.saveFileTimeout);
            }
            // set a new timer with 1000 microseconds
            this.saveFileTimeout = setTimeout(() => {
                this.markdownSaveFile()
            }, 1000);
        }
    }

    /**
     * @description calling saveFile() from FolderModule.
     */
    markdownSaveFile(): void {
        const index = this.Folder.TabBar.currFocusTabIndex;
        const nodeInfo = this.Folder.TabBar.openedTabInfo[index] as TreeNode;
        const newText = this.editor!.getMarkdown();
        this.Folder.saveFile(nodeInfo, newText);
    }

    /**
     * @description setup markdown relevant listeners.
     */
    setListeners(): void {

        ipcRendererOn('Ctrl+S', () => {
            if (!this.Folder.TabBar.emptyTab) {
                if (this.saveFileTimeout) {
                    clearTimeout(this.saveFileTimeout);
                }
                this.markdownSaveFile();
            }
        })

    }

}

