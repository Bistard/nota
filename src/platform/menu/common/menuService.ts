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

export interface ISubMenuItem {
    label?: string;
    role?: Electron.MenuItemConstructorOptions['role'];
    type?: Electron.MenuItemConstructorOptions['type'];
    
    commandId?: string;
    click?: () => void;
    submenu?: ISubMenuItem[];
}

export interface IMenuItem {
    label: string;
    submenu?: ISubMenuItem[];
}
