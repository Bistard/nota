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
import { ConfigService } from 'src/code/common/service/configService';
import { FileNode } from 'src/base/node/fileTree';
import { Component, IComponent } from 'src/code/browser/workbench/component';
import { EVENT_EMITTER } from 'src/base/common/event';
import { MarkdownRenderMode } from 'mdnote';
import { getSvgPathByName, SvgType } from 'src/base/common/string';
import { ContextMenuType, Coordinate } from 'src/base/browser/secondary/contextMenu/contextMenu';
import { IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { createDecorator } from 'src/code/common/service/instantiation/decorator';
import { IComponentService } from 'src/code/browser/service/componentService';

export const IMarkdownService = createDecorator<IMarkdownService>('markdown-service');

export interface IMarkdownService extends IComponent {
    createMarkdownEditor(): void;
    onTextChange(): void;
    markdownDisplayFile(nodeInfo: FileNode): void;
    markdownModeSwitch(): void;
}

/**
 * @description MarkdownComponent initializes markdown renderer and windows and
 * handling a few other shortcuts as well.
 */
export class MarkdownComponent extends Component implements IMarkdownService {

    private editor: Editor | null;
    private saveFileTimeout: NodeJS.Timeout | null;
    private colorSyntaxOptions: any;

    private mode: MarkdownRenderMode;

    constructor(parentComponent: Component,
                parentElement: HTMLElement,
                @IComponentService componentService: IComponentService,
                @IContextMenuService private readonly contextMenuService: IContextMenuService,
        ) {
        super('markdown', parentComponent, parentElement, componentService);

        this.mode = ConfigService.Instance.defaultMarkdownMode;
        
        this.editor = null;
        
        /**
         * after markdown content is changed, a timeout will be set if the 
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

    protected override _createContent(): void {
        this.createMarkdownEditor();
    }
    protected override _registerListeners(): void {
       /*
        domNodeByIdAddListener('markdown', 'contextmenu', (event) => {
            event.preventDefault()
            console.log('right clicked on markdown')
            //console.log(event.target)
            //console.log(event.currentTarget)
            ipcRendererSend('showContextMenu')        
        })
        */
        
        /**
         * @readonly register context menu listeners (right click menu)
         */
        this.container.addEventListener('contextmenu', (ev: MouseEvent) => {
            
            ev.preventDefault();
            this.contextMenuService.removeContextMenu();

            let coordinate: Coordinate = {
                coordinateX: ev.pageX,
                coordinateY: ev.pageY,
            };
            
            const element = ev.target as HTMLElement;
            const tagName = element.tagName;
            const parentElement = element.parentElement?.tagName;
            const menu = document.querySelector(".toastui-editor-context-menu") as HTMLElement;
            
            if (tagName == 'TD' || tagName == 'TH') {

            } else if (tagName == 'P') {
                menu.style.display = 'none';
                this.contextMenuService.createContextMenu(ContextMenuType.editor, coordinate);
            } else {
                this.contextMenuService.createContextMenu(ContextMenuType.editor, coordinate);
            } 
    
        });

        // spellcheck config check
        if (!ConfigService.Instance.markdownSpellCheckOn) {
            this.container.setAttribute('spellcheck', 'false');
        }

        EVENT_EMITTER.register('EMarkdownDisplayFile', (nodeInfo: FileNode) => this.markdownDisplayFile(nodeInfo));
        EVENT_EMITTER.register('EMarkdownModeSwitch', () => this.markdownModeSwitch());
        // ipcRendererOn('Ctrl+S', () => {
        //     if (!this.explorerViewComponent.TabBar.emptyTab) {
        //         if (this.saveFileTimeout) {
        //             clearTimeout(this.saveFileTimeout);
        //         }
        //         this.markdownSaveFile();
        //     }
        // })

        /**
         * @readonly registers right click menu listeners
         */

        /*
        domNodeByIdAddListener('markdown', 'contextmenu', (event) => {
            event.preventDefault();
            const element = event.target as HTMLElement;
            const tagName = element.tagName;
            const parentElement = element.parentElement?.tagName;
            const menu = document.querySelector(".toastui-editor-context-menu") as HTMLElement;
           // if (tagName == 'TD' || tagName == 'TH' || parentElement == 'TD' || parentElement == 'TH' ) {
            if (tagName == 'TD' || tagName == 'TH') {
                // console.log('Chart Context Menu');
            }else if (tagName == 'P') {
                menu.style.display = 'none';
                ipcRendererSend('showContextMenuEditor');
            } else {
                ipcRendererSend('showContextMenuEditor');     
            }
        });
        */
    }

    /**
     * @description instantiates editor constructor and markdown view. Editor's
     * events's callback functions will also be set here.
     */
    public createMarkdownEditor(): void {

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
                change: () => { this.onTextChange() },
            },
            placeholder: 'type your magic word...',
            plugins: [
                [codeSyntaxHighlight, { highlighter: Prism }],
                [colorSyntax, this.colorSyntaxOptions]
            ],
        })

        editor.getMarkdown();
        this.editor = editor;
        // TODO: remove later
        (window as any).editor = editor; // set as global value 

    }

    /**
     * @description callback function for 'editor.event.change'.
     */
    public onTextChange(): void {
        if (ConfigService.Instance.fileAutoSaveOn) {
            // if content is changed before the previous timeout has reached, 
            // clear the preivous one.
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
     * @description will be registered into eventEmitter as 'EMarkdownDisplayFile' 
     * event.
     */
    public markdownDisplayFile(nodeInfo: FileNode): void {
        if (!this.editor) {
            // do log here.
            return;
        }

        if (nodeInfo && !nodeInfo.isFolder) {
            this.editor.setMarkdown(nodeInfo.file!.plainText, false);
        } else {
            this.editor.setMarkdown('', false);
        }
    }

    /**
     * @description change the mode of markdown renderering method. They are 
     * 'wysiwyg', 'instant' and 'split'.
     */
     public markdownModeSwitch(): void {
        if (this.mode == 'wysiwyg') {
            $('#mode-switch').removeClass('function-button-focus');
            $('#mode-switch > img').attr('src', getSvgPathByName(SvgType.base, 'md-split'));
            this.editor!.changeMode('markdown', true);
            this.mode = 'split';
        } else if (this.mode == 'instant') {
            // ...
        } else { // (mode == 'split')
            $('#mode-switch').addClass('function-button-focus');
            $('#mode-switch > img').attr('src', getSvgPathByName(SvgType.base, 'md-wysiwyg'));
            this.editor!.changeMode('wysiwyg', true);
            this.mode = 'wysiwyg';
        }
    }
    
    /**
     * @description calling saveFile() from explorerViewComponent.
     */
    // TODO: remove later
    public markdownSaveFile(): void {
        
        const newText = this.editor!.getMarkdown();
        // saveMarkdownFile();
    }

}

