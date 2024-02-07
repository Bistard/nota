import 'src/workbench/services/notification/media.scss';
import { Disposable, IDisposable } from "src/base/common/dispose";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { Button, IButtonOptions} from "src/base/browser/basic/button/button";
import { Icons } from 'src/base/browser/icon/icons';
import { panic } from 'src/base/common/result';

export const INotificationService = createService<INotificationService>('notification-service');

export interface INotificationService extends IDisposable, IService {
    error(error: string | Error): void;
    confirm(title: string, message: string): Promise<boolean>;
    notify(options: INotificationOptions): void;
}

export interface INotificationOptions {
    title?: string;
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
        panic('Error method not implemented.'); 
    }

    public notify(options: INotificationOptions): void {
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        const content = document.createElement('div');
        content.className = 'notification-content';


        // Create and style the title
        if (options.title) {
            const title = document.createElement('div');
            title.className = 'notification-title';
            title.innerHTML = `<strong>${options.title}</strong><br>`;
            content.appendChild(title);
        }
        const message = document.createElement('div');
        message.className = 'notification-message';
        message.textContent = options.message;
        content.appendChild(message);

        // content.textContent = options.message;

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'notification-actions';

        const closeButtonOptions: IButtonOptions = {
            icon: Icons.Cross,
            classes: ['notification-close-button']
        };
        const closeButton = new Button(closeButtonOptions);
        
        this.__register(closeButton.onDidClick(() => {
            // Make the notification invisible before removing it
            notification.style.height = '0';
            notification.style.marginBottom = '-10px';
            notification.style.opacity = '0';
            notification.style.padding = '0';
            notification.style.borderWidth = '0';
            notification.style.transform = 'scaleY(0)';
            
            // Wait for the transitions to finish before removing the element
            notification.addEventListener('transitionend', () => {
                if (notification.parentNode === this._parent) {
                    this._parent.removeChild(notification);
                }
            });
        }));
        
        closeButton.render(actionsContainer);

        notification.appendChild(content);
        notification.appendChild(actionsContainer);

        // Buttons for any additional actions
        
        // Iterate over the provided actions and create a button for each
        // options.actions?.forEach((action, index) => {
        // // Ensure no more than three buttons are created
        //     if (index < 3) {
        //         const buttonOptions: IButtonOptions = {
        //             label: action.label,
        //         };
        //         const actionButton = new Button(buttonOptions);
        //         this.__register(actionButton.onDidClick(() => {
        //             action.callback();
        //             // Optional: Close the notification when an action button is clicked
        //             // this._parent.removeChild(notification);
        //         }));
        //         actionButton.render(actionsContainer); // Render the action button
        //     }
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