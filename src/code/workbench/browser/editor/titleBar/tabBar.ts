import { Editor } from '@toast-ui/editor/types/editor';
import * as fs from 'fs';
import { WriteFileOptions } from 'original-fs';
import { ConfigModule } from 'src/base/config';
import { FileNode } from 'src/base/node/fileTree';
import { ipcRendererOn, ipcRendererSendTest } from 'src/base/electron/register';
import { Component } from 'src/code/workbench/browser/component';
import { EditorComponentType } from 'src/code/workbench/browser/editor/editor';

/**
 * @description TabBarComponent stores all the opened tabs data and handles all the 
 * tabBar relevant listeners and business.
 */
// FIX: currently this component is DISABLED. No need to read this right now.
export class TabBarComponent extends Component {

    public emptyTab: boolean;
    public openedTabCount: number;

    public openedTabInfo: FileNode[];
    currFocusTabIndex: number;

    constructor(parentComponent: Component) {
        super(EditorComponentType.tabBar, parentComponent);

        this.emptyTab = true;
        this.openedTabCount = 0;
        this.openedTabInfo = [];
        this.currFocusTabIndex = -1;
    }

    protected override _createContent(): void {
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'tab-container';
        this.container.appendChild(this.contentArea);
    }

    protected override _registerListeners(): void {
        
        // able to scroll horizontally using middle mouse
        // TODO: complete
        this.contentArea!.addEventListener('wheel', (event) => {
            this.contentArea!.scrollLeft += event.deltaY;
        })

        // switch tab forwards
        ipcRendererOn('Ctrl+Tab', () => {
            if (!this.emptyTab && this.openedTabCount != 1) {
                const index = (this.currFocusTabIndex + 1) % this.openedTabCount;
                const tab = this.contentArea!.children[index] as HTMLElement;
                let nodeInfo = this.openedTabInfo[index] as FileNode;
                this.openTab(tab, index, nodeInfo);
            }
        });
        
        // switch tab backwards
        ipcRendererOn('Ctrl+Shift+Tab', () => {
            if (!this.emptyTab && this.openedTabCount != 1) {
                const index = (this.currFocusTabIndex - 1 + this.openedTabCount) % this.openedTabCount;
                const tab = this.contentArea!.children[index] as HTMLElement;
                let nodeInfo = this.openedTabInfo[index] as FileNode;
                this.openTab(tab, index, nodeInfo);
            }
        });
        
        // close current focused tab
        
        ipcRendererOn('Ctrl+W', () => {
            if (!this.emptyTab) {
                const tab = this.contentArea!.children[this.currFocusTabIndex] as HTMLElement;
                let nodeInfo = this.openedTabInfo[this.currFocusTabIndex] as FileNode;
                this.closeTab(tab, nodeInfo);
            }
        });

    }

    /**
     * @description By the given FileNode, initializes a new HTMLElement tab 
     * and sets 'click' listeners. The 1st return value indicates if the tab is
     * already opened. The following return values indicates its coressponding 
     * information.
     * 
     * @returns {[boolean, number, HTMLElement]} [isExist, exsistedIndex, tab]
     */
    public initTab(nodeInfo: FileNode): [boolean, number, HTMLElement] {
        // loop to search if the tab is existed or not
        let i = 0;
        for (i = 0; i < this.openedTabCount; i++) {
            if (nodeInfo.path == (this.openedTabInfo[i] as FileNode).path) {
                // tab exists
                return [true, i, this.contentArea!.childNodes[i] as HTMLElement];
            }
        }

        // initializes a new HTMLElement tab
        const newTab = document.createElement('div');
        const tabText = document.createElement('div');
        const tabCloseIcon = document.createElement('img');
        
        newTab.classList.add('tab');
        tabText.classList.add('tab-text');
        tabText.innerHTML = nodeInfo.name;
        tabCloseIcon.classList.add('tab-close-icon');
        tabCloseIcon.classList.add('vertical-center');

        newTab.append(tabText);
        newTab.append(tabCloseIcon);

        /// when the tab is clicked, switch to that tab
        newTab.addEventListener('click', () => {
            let index = this.openedTabInfo.indexOf(nodeInfo);
            this.openTab(newTab, index, nodeInfo);
        })

        // close tab listeners
        tabCloseIcon.addEventListener('click', (event) => {
            // prevent parent click when clicked on child
            event.stopPropagation();
            this.closeTab(newTab, nodeInfo);
        })
        
        // the tab is not opened, newTab will be inserted at the end of the 
        // tabBar
        return [false, i, newTab];
    }

    /**
     * @description Given a HTMLElement, inserts it into the tabBar.
     * 
     * @param {HTMLElement} element the tab to be inserted
     * @param {FileNode} nodeInfo tabInfo
     * @returns {void} void
     */
    public insertTab(element: HTMLElement, nodeInfo: FileNode): void {
        $('#tabBar').append(element);
        this.currFocusTabIndex = this.openedTabCount;
        this.openedTabCount++;
        this.emptyTab = false;
        this.openedTabInfo.push(nodeInfo);
    }

    /**
     * @description Given a HTMLElement, switches to that tab and displays its 
     * content on the markdown view.
     * 
     * @param {HTMLElement} tab tab to be opened
     * @param {number} index index in the tabBar
     * @param {FileNode} nodeInfo tabInfo
     * @returns {void} void
     */
    public openTab(tab: HTMLElement, index: number, nodeInfo: FileNode): void {
        // TODO: improve efficiency
        $('.tab').each(function() {
            $(this).removeClass('tab-clicked');
        })
        tab.classList.add('tab-clicked');
        
        this.currFocusTabIndex = index;
        this.displayTab(nodeInfo);
    }

    /**
     * @description displays a new string content onto the markdown view.
     */
    public displayTab(nodeInfo: FileNode | null): void {
        // setMarkdown() will emit Editor.event.change callback
        // ipcRenderer.send('test', 'setMarkdown()')
        if (nodeInfo && !nodeInfo.isFolder) {
            ((window as any).editor as Editor).setMarkdown(nodeInfo.file!.plainText, false);
        } else {
            ((window as any).editor as Editor).setMarkdown('', false);
        }
    }

    /**
     * @description Given a HTMLElement, close that given tab. Switches to the 
     * next avaliable tab and displays its content.
     * 
     * If auto-save is on, current changes will be async auto-saved.
     * If auto-save is off, closing tab will pop up a warning to warn you to save or not.
     */
    public closeTab(element: HTMLElement, nodeInfo: FileNode): void {
        
        this.contentArea!.removeChild(element);

        // save current change immediately
        if (ConfigModule.Instance.fileAutoSaveOn) {
            /**
             * TODO: currently, written texts are from nodeInfo.plainText. If we decide to use 
             * mutiple threads for each tab, the texts should read from window.editor.getMarkdown()
             */

            let writeOption: WriteFileOptions = {
                encoding: 'utf-8',
                flag: 'w'
            };
            // FIX: shouldn't be nodeInfo.plainText, 
            fs.writeFile(nodeInfo.path, nodeInfo.file!.plainText, writeOption, (err) => {
                if (err) {
                    throw err;
                }
                ipcRendererSendTest('close saved');
            })
        } else {
            // pop up a warning window
            // TODO: complete
        }
        nodeInfo.file!.plainText = '';
        let index = this.openedTabInfo.indexOf(nodeInfo);
        this.openedTabInfo.splice(index, 1);
        
        this.openedTabCount--;
        if (this.openedTabCount == 0) {
            this.emptyTab = true;
            this.currFocusTabIndex = -1;
            this.displayTab(null);
            return;
        }

        if (index == this.currFocusTabIndex) {
            if (index == this.openedTabCount) {
                index--;
            }
            const nextFocusTab = this.contentArea!.childNodes[index] as HTMLElement;
            const nextFocustabInfo = this.openedTabInfo[index] as FileNode;
            this.openTab(nextFocusTab, index, nextFocustabInfo);
        } else if (index < this.currFocusTabIndex) {
            this.currFocusTabIndex--;
        }
    }

}