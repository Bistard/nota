import 'src/workbench/services/notification/media.scss';
import { Disposable, IDisposable } from "src/base/common/dispose";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { Button, IButtonOptions} from "src/base/browser/basic/button/button";
import { Icons } from 'src/base/browser/icon/icons';
import { panic } from "src/base/common/utilities/panic";

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
    readonly label: string;
    run: () => void;
    
    // styles
    readonly notificationBackground?: string;
    readonly notificationForeground?: string;
}

/**
 * @class Provides notification services, such as displaying error messages, 
 * notifications, and confirmation dialogs.
 */
export class NotificationService extends Disposable implements INotificationService {

    declare _serviceMarker: undefined;

    // [fields]

    private readonly _parent: HTMLElement;
    private readonly _container: HTMLElement;
    
    // [constructor]

    constructor(parent: HTMLElement = document.body) {
        super();
        this._parent = parent;
        
        const element = document.createElement('div');
        this._container = element;

        element.className = 'notification-container';
        this._parent.appendChild(element);
    }

    // [public methods]

    public error(error: string | Error): void {
        panic('Error method not implemented.'); 
    }

    public notify(options: INotificationOptions): void {
        const notification = document.createElement('div');
        notification.className = 'notification';
    
        // Render the content part
        this.__renderContent(notification, options);

        // Render the close button
        this.__renderCloseButton(notification);
    
        // Render custom action buttons
        if (options.actions && options.actions.length) {
            this.__renderCustomActionButtons(options.actions, notification);
        }
    
        // actual rendering
        this._container.appendChild(notification);
    }

    private __renderContent(container: HTMLElement, opts: INotificationOptions): void {
        const content = document.createElement('div');
        content.className = 'notification-content';
    
        // Create and style the title
        if (opts.title !== undefined) {
            const title = document.createElement('div');
            title.className = 'notification-title';
            title.innerHTML = `<strong>${opts.title}</strong><br>`;
            content.appendChild(title);
        }
    
        const message = document.createElement('div');
        message.className = 'notification-message';
        message.textContent = opts.message;
        content.appendChild(message);

        container.appendChild(content);
    }
    
    private __renderCloseButton(container: HTMLElement): void {
        const closeButtonContainer = document.createElement('div');
        closeButtonContainer.className = 'notification-close-container';
    
        const closeButtonOptions: IButtonOptions = {
            id: 'close',
            icon: Icons.Close,
            classes: ['notification-close-button']
        };
    
        const closeButton = new Button(closeButtonOptions);
        this.__register(closeButton.onDidClick(() => {
            this.closeNotification(container);
            container.remove();
        }));
        closeButton.render(closeButtonContainer);
        container.appendChild(closeButtonContainer);
    }
    
    private __renderCustomActionButtons(actions: INotificationAction[], container: HTMLElement): void {
        const customActionsContainer = document.createElement('div');
        customActionsContainer.className = 'notification-custom-actions';
    
        actions.forEach((action, index) => {
            // Ensure no more than three buttons are created
            if (index < 3) {
                const buttonOptions: IButtonOptions = {
                    id: '',
                    label: action.label,
                    buttonBackground: action.notificationBackground,
                    buttonForeground: action.notificationForeground,
                    classes: ['custom-action-button'],
                };
                const actionButton = new Button(buttonOptions);
                this.__register(actionButton.onDidClick(() => action.run()));

                actionButton.render(document.createElement('div'));
                customActionsContainer.appendChild(actionButton.element);
            }
        });
    
        // Append the custom actions container at the bottom of the notification
        if (customActionsContainer.hasChildNodes()) {
            customActionsContainer.style.alignSelf = 'flex-end';
            customActionsContainer.style.paddingTop = '10px'; // spaces between msgs and btns
            container.appendChild(customActionsContainer);
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