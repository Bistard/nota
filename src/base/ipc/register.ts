import { ipcRenderer, IpcRendererEvent } from "electron";

/**
 * ipc/dom event register relevant helper functions.
 */

export function ipcRendererSend(message: string): void {
    ipcRenderer.send(message);
}

export function ipcRendererSendData(message: string, data: any): void {
    ipcRenderer.send(message, data);
}

/* debug only */
export function ipcRendererSendTest(data: any): void {
    ipcRenderer.send('test', data);
}

export function ipcRendererOn(message: string, listener: (event: IpcRendererEvent, ...args: any[]) => void): void {
    ipcRenderer.on(message, listener);
}

export function domNodeAddListener<T extends HTMLElement>(node: T, eventType: string, listener: EventListenerOrEventListenerObject): void {
    node.addEventListener(eventType, listener);
}

export function domNodeByIdAddListener(nodeName: string, eventType: string, listener: EventListenerOrEventListenerObject): void {
    const domNode = document.getElementById(nodeName);
    if (domNode === null) {
        return;
    }
    domNode.addEventListener(eventType, listener);
}

export function domNodeByClassAddListener(className: string, eventType: string, listener: EventListenerOrEventListenerObject): void {
    const domNodes: HTMLCollectionOf<Element> = document.getElementsByClassName(className);
    if (!domNodes.length) {
        return;
    }
    for (let i: number = 0; i < domNodes.length; i++) {
        domNodeAddListener(domNodes[i] as HTMLElement, eventType, listener);
    }   
}