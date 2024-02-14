import 'src/workbench/services/notification/media.scss';
import { Disposable, IDisposable } from "src/base/common/dispose";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { Button, IButtonOptions} from "src/base/browser/basic/button/button";
import { Icons } from 'src/base/browser/icon/icons';
import { panic } from 'src/base/common/result';

export const INotificationService = createService<INotificationService>('notification-service');

/**
 * An interface only for {@link NotificationService}.
 */
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
    backgroundColor?: string;
    textColor?: string;
}

export class NotificationService extends Disposable implements INotificationService {

    declare _serviceMarker: undefined;
    private readonly _parent: HTMLElement;
    private readonly _container: HTMLElement;
    
    constructor(parent: HTMLElement = document.body) {
        super();
        this._parent = parent;
        
        const element = document.createElement('div');
        this._container = element;

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
        if (options.title !== undefined) {
            const title = document.createElement('div');
            title.className = 'notification-title';
            title.innerHTML = `<strong>${options.title}</strong><br>`;
            content.appendChild(title);
        }
    
        const message = document.createElement('div');
        message.className = 'notification-message';
        message.textContent = options.message;
        content.appendChild(message);
    
        notification.appendChild(content);
    
        // Render the close button
        this.__renderCloseButton(notification);
    
        // Render custom action buttons
        if (options.actions && options.actions.length) {
            this.__renderCustomActionButtons(options.actions, notification);
        }
    
        // Add the notification to the notification container (actual rendering)
        this._container.appendChild(notification);
    }
    
    private __renderCloseButton(notification: HTMLElement): void {
        const closeButtonContainer = document.createElement('div');
        closeButtonContainer.className = 'notification-close-container';
    
        const closeButtonOptions: IButtonOptions = {
            icon: Icons.Cross,
            classes: ['notification-close-button']
        };
    
        const closeButton = new Button(closeButtonOptions);
        this.__register(closeButton.onDidClick(() => {
            this.closeNotification(notification);
            notification.remove();
        }));
        closeButton.render(closeButtonContainer);
    
        // Append the close button container at the top right of the notification
        notification.appendChild(closeButtonContainer);
    }
    
    private __renderCustomActionButtons(actions: INotificationAction[], notification: HTMLElement): void {
        const customActionsContainer = document.createElement('div');
        customActionsContainer.className = 'notification-custom-actions';
    
        // Iterate over the provided actions and create a button for each
        actions.forEach((action, index) => {
            if (index < 3) { // Ensure no more than three buttons are created
                const buttonOptions: IButtonOptions = {
                    label: action.label,
                    backgroundColor: action.backgroundColor,
                    textColor: action.textColor,
                    classes: ['custom-action-button'],
                };
                const actionButton = new Button(buttonOptions);
                this.__register(actionButton.onDidClick(() => {
                    action.callback();
                    // Optional: Close the notification when an action button is clicked
                    // this.closeNotification(notification);
                }));
                actionButton.render(document.createElement('div'));
                customActionsContainer.appendChild(actionButton.element);
            }
        });
    
        // Append the custom actions container at the bottom of the notification
        if (customActionsContainer.hasChildNodes()) { // Only append if there are action buttons
            customActionsContainer.style.alignSelf = 'flex-end';
            customActionsContainer.style.paddingTop = '10px'; // spaces between msgs and btns
            notification.appendChild(customActionsContainer);
        }
    }  
    
    private closeNotification(notification: HTMLElement): void {
    
        // Wait for the transitions to finish before removing the element
        notification.addEventListener('transitionend', () => {
            if (notification.parentNode === this._parent) {
                this._parent.removeChild(notification);
            }
        });
    }
    
    public confirm(title: string, message: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const result = window.confirm(`${title}\n\n${message}`);
            resolve(result);
        });
    }
}