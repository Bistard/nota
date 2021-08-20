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
import { FolderViewComponent } from 'src/code/workbench/browser/actionView/folder/folder';
import { TreeNode } from 'src/code/workbench/browser/actionView/folder/foldertree';
import { ipcRendererOn } from 'src/base/ipc/register';
import { Component } from 'src/code/workbench/browser/component';
import { IRegisterService } from 'src/code/workbench/service/registerService';

/**
 * @description MarkdownComponent initializes markdown renderer and windows and
 * handling a few other shortcuts as well.
 */
export class MarkdownComponent extends Component {
    
    // folderViewComponent: FolderViewComponent;

    editor: Editor | null;

    saveFileTimeout: NodeJS.Timeout | null;

    colorSyntaxOptions: any;

    constructor(registerService: IRegisterService) {
        super('markdown', registerService);

        // this.folderViewComponent = folderViewComponent;

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
    }

    protected override _createContainer(): void {
        this.parent.appendChild(this.container);
        // customize...
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        this.createMarkdownEditor();
    }
    protected override _registerListeners(): void {
        
        // spellcheck config check
        if (!ConfigModule.markdownSpellCheckOn) {
            const markdown = document.getElementById('markdown') as HTMLElement;
            markdown.setAttribute('spellcheck', 'false');
        }
        
        // ipcRendererOn('Ctrl+S', () => {
        //     if (!this.folderViewComponent.TabBar.emptyTab) {
        //         if (this.saveFileTimeout) {
        //             clearTimeout(this.saveFileTimeout);
        //         }
        //         this.markdownSaveFile();
        //     }
        // })
    }

    /**
     * @description instantiates editor constructor and markdown view. Editor's
     * events's callback functions will also be set here.
     */
    createMarkdownEditor(): void {

        let editor = new Editor({
            el: this.container, // HTMLElement container for markdown editor
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
        (window as any).editor = editor; // set as global value TODO: remove later

    }

    /**
     * @description callback function for 'editor.event.change'.
     */
    onChange(): void {
        // check if file-auto-save is ON
        if (ConfigModule.fileAutoSaveOn) {
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
     * @description calling saveFile() from folderViewComponent.
     */
    markdownSaveFile(): void {
        // const index = this.folderViewComponent.TabBar.currFocusTabIndex;
        // const nodeInfo = this.folderViewComponent.TabBar.openedTabInfo[index] as TreeNode;
        // const newText = this.editor!.getMarkdown();
        // this.folderViewComponent.saveFile(nodeInfo, newText);
    }

}

