import { createService, IService } from "src/platform/instantiation/common/decorator";

export const IMenuService = createService<IMenuService>('menu-service');

export interface IMenuService extends IService {}

export const MenuLabels = {
    File: 'File',
    Edit: 'Edit',
    View: 'View',
    Help: 'Help'
};

export const enum CommandID {
    NewFile = 'newFile',
    OpenFile = 'openFile',
    ExitApp = 'exitApp',
    Undo = 'undo',
    Redo = 'redo',
    About = 'about',
}

export const MenuTemplate = [
    {
        label: MenuLabels.File,
        submenu: [
            { label: 'New', commandId: CommandID.NewFile },
            { label: 'Open', commandId: CommandID.OpenFile },
            { type: 'separator' },
            { label: 'Exit', commandId: CommandID.ExitApp, role: 'quit' },
        ],
    },
    {
        label: MenuLabels.Edit,
        submenu: [
            { role: 'undo', commandId: CommandID.Undo },
            { role: 'redo', commandId: CommandID.Redo },
        ],
    },
    {
        label: MenuLabels.Help,
        submenu: [
            { label: 'About', commandId: CommandID.About },
        ],
    },
];
