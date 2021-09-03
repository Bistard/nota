import { FileNode } from 'src/base/node/fileTree';
import { ipcRendererOn } from 'src/base/electron/register';
import { Component } from 'src/code/browser/workbench/component';
import { EditorComponentType } from 'src/code/browser/workbench/editor/editor';
import { IComponentService } from 'src/code/browser/service/componentService';
import { pathJoin } from 'src/base/common/string';
import { EVENT_EMITTER } from 'src/base/common/event';
import { ConfigService } from 'src/code/common/service/configService';

export class Tab {
    public readonly container: HTMLElement = document.createElement('div');
    public readonly textContainer: HTMLElement = document.createElement('div');
    public readonly iconContainer: HTMLElement = document.createElement('div');

    public readonly nodeInfo: FileNode;

    constructor(tabsContainer: HTMLElement, nodeInfo: FileNode) {

        this.nodeInfo = nodeInfo;

        this.container.classList.add('tab');
        this.textContainer.classList.add('tab-text-container');
        this.iconContainer.classList.add('tab-icon-container');

        // handle text
        const textElement = document.createElement('div');
        textElement.classList.add('tab-text')
        this.textContainer.appendChild(textElement);

        // handle icon
        const iconElement = document.createElement('div');
        iconElement.classList.add('tab-icon', 'vertical-center');
        this.iconContainer.appendChild(iconElement);

        // add to parent
        this.container.appendChild(this.textContainer);
        this.container.appendChild(this.iconContainer);
        tabsContainer.appendChild(this.container);

        this._registerListeners();
    }

    private _registerListeners(): void {
        
        // tab listener
        this.container.addEventListener('click', () => {
            EVENT_EMITTER.emit('ESwitchToTab', this);
        });

        // close icon listener
        this.iconContainer.firstElementChild!.addEventListener('click', (event: Event) => {
            event.stopPropagation();
            EVENT_EMITTER.emit('ETabBarCloseTab', this);
        });

    }

    public focus(prevTab: Tab | null = null): void {
        if (prevTab) {
            prevTab.loseFocus();
        }
        this.container.classList.add('tab-focused');
    }

    public loseFocus(): void {
        this.container.classList.remove('tab-focused');
    }

    public setText(text: string): void {
        const textElement = this.textContainer.firstChild!;
        textElement.textContent = text;
    }
    
}

/**
 * @description TabBarComponent stores all the opened tabs data and handles all the 
 * tabBar relevant listeners and business.
 */
export class TabBarComponent extends Component {

    private static readonly TAB_HEIGHT = 27;
    private static readonly TAB_BAR_HEIGHT = 30;

    private readonly _openedTab: Tab[];
    
    /**
     * @description this should NOT be modified directly, use focusTabIndex instead
     */
    private _focusTabIndex: number = -1;

    public set focusTabIndex(newIndex: number) {
        
        // when focusTabIndex is setted, we update the focus style
        const prevFocusTabIndex = this._focusTabIndex;
        this._focusTabIndex = newIndex;

        if (prevFocusTabIndex >= 0) {
            const tab = this._openedTab[prevFocusTabIndex];
            if (tab) {
                tab.loseFocus();
            }
        }
        if (newIndex >= 0) {
            const newFocusTab = this._openedTab[newIndex]!;
            newFocusTab.focus();
            EVENT_EMITTER.emit('EMarkdownDisplayFile', newFocusTab.nodeInfo);
        } else {
            EVENT_EMITTER.emit('EMarkdownDisplayFile', null);
        }
        
    }

    public get focusTabIndex(): number {
        return this._focusTabIndex;
    }

    constructor(
        parentComponent: Component,
        @IComponentService componentService: IComponentService,
    ) {
        super(EditorComponentType.tabBar, parentComponent, null, componentService);

        this._openedTab = [];
        this.focusTabIndex = -1;
    }

    protected override _createContent(): void {
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'tab-bar-container';
        this.container.appendChild(this.contentArea);
    }

    protected override _registerListeners(): void {
        
        EVENT_EMITTER.register('ETabBarSwitchOrCreateTab', (nodeInfo: FileNode) => this.switchOrCreateTab(nodeInfo));
        EVENT_EMITTER.register('ESwitchToTab', (tab: Tab) => this.switchToTab(this._openedTab.indexOf(tab)));
        EVENT_EMITTER.register('ETabBarCloseTab', (tab: Tab) => this.closeTab(tab));

        // able to scroll horizontally using middle mouse
        // TODO: complete
        this.contentArea!.addEventListener('wheel', (event) => {
            this.contentArea!.scrollLeft += event.deltaY;
        })

        // switch tab forwards
        ipcRendererOn('Ctrl+Tab', () => {
            if (this._openedTab.length >= 2) {
                const index = (this.focusTabIndex + 1) % this._openedTab.length;
                this.switchToTab(index);
            }
        });
        
        // switch tab backwards
        ipcRendererOn('Ctrl+Shift+Tab', () => {
            if (this._openedTab.length >= 2) {
                const index = (this.focusTabIndex - 1 + this._openedTab.length) % this._openedTab.length;
                this.switchToTab(index);
            }
        });
        
        // close current focused tab
        ipcRendererOn('Ctrl+W', () => {
            if (this.focusTabIndex >= 0) {
                const focusedTab = this._openedTab[this.focusTabIndex]!;
                this.closeTab(focusedTab);
            }
        });

        // open previous closed tab
        ipcRendererOn('Ctrl+Shift+T', () => {
            
        });

    }

    public switchOrCreateTab(nodeInfo: FileNode): Tab {
        let tab: Tab;

        if (this._openedTab.length === 0) {
            tab = this.createTab(0, nodeInfo);
            return tab;
        }
        
        const index = this.isTabExisted(nodeInfo);
        if (index >= 0) {
            tab = this.switchToTab(index);
        } else {
            tab = this.createTab(this._openedTab.length, nodeInfo);
        }

        return tab;
    }

    public createTab(index: number, nodeInfo: FileNode): Tab {
        
        const newTab = new Tab(this.contentArea!, nodeInfo);
        
        if (this.isTabExisted(nodeInfo) >= 0) {
            newTab.setText(pathJoin(nodeInfo.path, nodeInfo.baseName));
        } else {
            newTab.setText(nodeInfo.baseName);
        }

        this._openedTab.splice(index, 0, newTab);
        this.focusTabIndex = index;
        return newTab;
    }

    public switchToTab(index: number): Tab {
        if (index < 0 || index >= this._openedTab.length) {
            throw Error('switching to an unexisted tab index');
        }
        this.focusTabIndex = index;
        return this._openedTab[index]!;
    }

    /**
     * @description check if the tab is opened, if true, we return the index of 
     * the tab, otherwise we return a negative number.
     */
    public isTabExisted(nodeInfoOrTab: FileNode | Tab): number {
        
        let i: number;
        if (nodeInfoOrTab instanceof Tab) {
            for (i = 0; i < this._openedTab.length; i++) {
                if (this._openedTab[i] === nodeInfoOrTab) {
                    return i;
                }
            }
        } else {
            for (i = 0; i < this._openedTab.length; i++) {
                if (this._openedTab[i]!.nodeInfo === nodeInfoOrTab) {
                    return i;
                }
            }
        }
        return -1;
    }

    public closeTab(tab: Tab): void {
        
        this.contentArea!.removeChild(tab.container);

        // // save current change immediately
        if (ConfigService.Instance.fileAutoSaveOn) {
            
            // TODO: efficiency issue (string passed mutiple times)
            const index = this._openedTab.indexOf(tab);
            if (index < 0) {
                throw Error('closing tab which is not existed');
            }

            let text: string;
            if (index === this.focusTabIndex) {
                const res = EVENT_EMITTER.emit('EMarkdownGetText');
                if (Array.isArray(res)) {
                    throw Error('unexpected error');
                }
                text = res;
            } else {
                text = tab.nodeInfo.file!.plainText;
            }
            // TODO: disable write functionality for now
            // writeToFile(tab.nodeInfo.path, tab.nodeInfo.baseName, text);
        } else {
            // TODO: complete (pop up a warning dialogBox)
        }

        let index = this._openedTab.indexOf(tab);
        this._openedTab.splice(index, 1);
        
        if (this._openedTab.length === 0) {
            // closing the only existed tab
            this.focusTabIndex = -1;
        } else if (index === this.focusTabIndex) {
            if (index === this._openedTab.length) {
                // closing last tab which is also the focused one
                index--;
            }
            // the focused tab moves to the right sibling
            this.focusTabIndex = index;
        } else if (index < this.focusTabIndex) {
            // closing the tab before the focused one
            this.focusTabIndex--;
        }

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
        // // loop to search if the tab is existed or not
        // let i = 0;
        // for (i = 0; i < this._openedTab.length; i++) {
        //     if (nodeInfo.path == (this._openedTab[i] as FileNode).path) {
        //         // tab exists
        //         return [true, i, this.contentArea!.childNodes[i] as HTMLElement];
        //     }
        // }

        // // initializes a new HTMLElement tab
        // const newTab = document.createElement('div');
        // const tabText = document.createElement('div');
        // const tabCloseIcon = document.createElement('img');
        
        // newTab.classList.add('tab');
        // tabText.classList.add('tab-text');
        // tabText.innerHTML = nodeInfo.name;
        // tabCloseIcon.classList.add('tab-close-icon');
        // tabCloseIcon.classList.add('vertical-center');

        // newTab.append(tabText);
        // newTab.append(tabCloseIcon);

        // /// when the tab is clicked, switch to that tab
        // newTab.addEventListener('click', () => {
        //     let index = this._openedTab.indexOf(nodeInfo);
        //     this.openTab(newTab, index, nodeInfo);
        // })

        // // close tab listeners
        // tabCloseIcon.addEventListener('click', (event) => {
        //     // prevent parent click when clicked on child
        //     event.stopPropagation();
        //     this.closeTab(newTab, nodeInfo);
        // })
        
        // // the tab is not opened, newTab will be inserted at the end of the 
        // // tabBar
        // return [false, i, newTab];
        return [true, -1, document.createElement('div')];
    }

    /**
     * @description Given a HTMLElement, inserts it into the tabBar.
     * 
     * @param {HTMLElement} element the tab to be inserted
     * @param {FileNode} nodeInfo tabInfo
     * @returns {void} void
     */
    public insertTab(element: HTMLElement, nodeInfo: FileNode): void {
        // $('#tabBar').append(element);
        // this.focusTabIndex = this._openedTab.length;
        // this._openedTab.length++;
        // this.emptyTab = false;
        // this._openedTab.push(nodeInfo);
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
        // // TODO: improve efficiency
        // $('.tab').each(function() {
        //     $(this).removeClass('tab-focused');
        // })
        // tab.classList.add('tab-focused');
        
        // this.focusTabIndex = index;
        // this.displayTab(nodeInfo);
    }

    /**
     * @description displays a new string content onto the markdown view.
     */
    public displayTab(nodeInfo: FileNode | null): void {
        // setMarkdown() will emit Editor.event.change callback
        // ipcRenderer.send('test', 'setMarkdown()')
        
        // if (nodeInfo && !nodeInfo.isFolder) {
        //     ((window as any).editor as Editor).setMarkdown(nodeInfo.file!.plainText, false);
        // } else {
        //     ((window as any).editor as Editor).setMarkdown('', false);
        // }
    }

    /**
     * @description Given a HTMLElement, close that given tab. Switches to the 
     * next avaliable tab and displays its content.
     * 
     * If auto-save is on, current changes will be async auto-saved.
     * If auto-save is off, closing tab will pop up a warning to warn you to save or not.
     */
    // public closeTab(element: HTMLElement, nodeInfo: FileNode): void {
        
        // this.contentArea!.removeChild(element);

        // // save current change immediately
        // if (ConfigService.Instance.fileAutoSaveOn) {
        //     /**
        //      * TODO: currently, written texts are from nodeInfo.plainText. If we decide to use 
        //      * mutiple threads for each tab, the texts should read from window.editor.getMarkdown()
        //      */

        //     let writeOption: WriteFileOptions = {
        //         encoding: 'utf-8',
        //         flag: 'w'
        //     };
        //     // FIX: shouldn't be nodeInfo.plainText, 
        //     fs.writeFile(nodeInfo.path, nodeInfo.file!.plainText, writeOption, (err) => {
        //         if (err) {
        //             throw err;
        //         }
        //         ipcRendererSendTest('close saved');
        //     })
        // } else {
        //     // pop up a warning window
        //     // TODO: complete
        // }
        // nodeInfo.file!.plainText = '';
        // let index = this._openedTab.indexOf(nodeInfo);
        // this._openedTab.splice(index, 1);
        
        // this._openedTab.length--;
        // if (this._openedTab.length == 0) {
        //     this.emptyTab = true;
        //     this.focusTabIndex = -1;
        //     this.displayTab(null);
        //     return;
        // }

        // if (index == this.focusTabIndex) {
        //     if (index == this._openedTab.length) {
        //         index--;
        //     }
        //     const nextFocusTab = this.contentArea!.childNodes[index] as HTMLElement;
        //     const nextFocustabInfo = this._openedTab[index] as FileNode;
        //     this.openTab(nextFocusTab, index, nextFocustabInfo);
        // } else if (index < this.focusTabIndex) {
        //     this.focusTabIndex--;
        // }
    // }

}