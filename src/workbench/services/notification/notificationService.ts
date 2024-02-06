import 'src/workbench/services/notification/media.scss';
import { Disposable, IDisposable } from "src/base/common/dispose";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { Button, IButtonOptions} from "src/base/browser/basic/button/button";
import { Icons } from 'src/base/browser/icon/icons';

export const INotificationService = createService<INotificationService>('notification-service');

export interface INotificationService extends IDisposable, IService {
    error(error: string | Error): void;
    confirm(title: string, message: string): Promise<boolean>;
    notify(options: INotificationOptions): void;
}

export interface INotificationOptions {
    message: string;
    actions?: INotificationAction[];
}

export interface INotificationAction {
    label: string;
    callback: () => void;
}

export class NotificationService extends Disposable implements INotificationService {

    private readonly _parent: HTMLElement;
    declare _serviceMarker: undefined;
    
    constructor(parent: HTMLElement = document.body) {
        super();
        this._parent = parent;
        const element = document.createElement('div');
        element.className = 'notification-container';
        this._parent.appendChild(element);
    }

    public error(error: string | Error): void {
        throw new Error('Error method not implemented.');
    }

    public notify(options: INotificationOptions): void {
        const notification = document.createElement('div');
        notification.className = 'notification';
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.textContent = options.message;

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'notification-actions';

        const closeButtonOptions: IButtonOptions = {
            icon: Icons.Cross,
            classes: ['notification-close-button']
        };
        const closeButton = new Button(closeButtonOptions);
        this.__register(closeButton.onDidClick(() => {
            this._parent.removeChild(notification);
        }));
        
        closeButton.render(actionsContainer);

        notification.appendChild(content);
        notification.appendChild(actionsContainer);

        // Buttons for any additional actions
        
        // options.actions?.forEach((action) => {
        //     const buttonOptions: IButtonOptions = {
        //         icon: Icons.Check,
        //         classes: ['notification-close-button']
        //     };
        //     const actionButton = new Button(buttonOptions);
        //     this.__register(actionButton.onDidClick(() => {
        //         action.callback();
        //         this._parent.removeChild(notification);
        //     }));
        //     actionButton.render(actionsContainer); // Render the action button
        // });

        const notificationContainer = this._parent.querySelector('.notification-container');
        if (notificationContainer) {
            notificationContainer.appendChild(notification);
        }
    }


    public confirm(title: string, message: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const result = window.confirm(`${title}\n\n${message}`);
            resolve(result);
        });
    }

    // private helper methods for managing notifications here
}