import 'src/workbench/services/notification/media.scss';
import { Disposable, IDisposable } from "src/base/common/dispose";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { Button, IButtonOptions} from "src/base/browser/basic/button/button";
import { Icons } from 'src/base/browser/icon/icons';
import { panic } from "src/base/common/utilities/panic";

export const INotificationService = createService<INotificationService>('notification-service');

export const enum INotificationTypes {
    Info = 'info',
    Warning = 'warning',
    Error = 'error'
}
/**
 * An interface only for {@link NotificationService}.
 */
export interface INotificationService extends IDisposable, IService {
    error(error: string | Error): void;
    confirm(message: string, subMessage: string): Promise<boolean>;
    notify(options: INotificationOptions): void;
}
export interface INotificationOptions {
    message: string;
    subMessage?: string;
    actions?: INotificationAction[];
    type?: INotificationTypes;
    icon?: Icons;
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
    commandService: any; // TODO: delete
    
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
    
    public confirm(message: string, subMessage: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const result = window.confirm(`${message}\n\n${subMessage}`);
            resolve(result);
        });
    }

    public notify(opts: INotificationOptions): void {

        const notification = document.createElement('div');
        notification.className = `notification ${opts.type}`;
    
        // Render the content part
        this.__renderContent(notification, opts);

        // Render the close button
        this.__renderCloseButton(notification);
    
        // Actual rendering
        this._container.appendChild(notification);

        // Handle auto removal for info notifications
        // Remove the notification after 10s
        if (opts.type === INotificationTypes.Info) {
            setTimeout(() => {
                this.__closeInfoNotification(notification);
                notification.classList.add('fade-out');
            }, 100000); // TODO: async.ts - CancellablePromise
        }
    }

    // [private methods]  
    
    private __renderCustomActionButtons(actions: INotificationAction[], container: HTMLElement, hasSubMessage: boolean): void {
        if (!actions || actions.length === 0) return;
    
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'notification-custom-actions';
        
        if (hasSubMessage) {
            actionsContainer.classList.add('submessage-actions');
        } else {
            actionsContainer.classList.add('no-submessage-actions');
        }
    
        actions.forEach((action, index) => {
            if (index < 3) { // Render up to 3 actions
                const buttonOptions: IButtonOptions = {
                    id: '',
                    label: action.label,
                    buttonBackground: action.notificationBackground,
                    buttonForeground: action.notificationForeground,
                    classes: ['custom-action-button'],
                };
                const actionButton = new Button(buttonOptions);
                this.__register(actionButton.onDidClick(() => action.run()));
    
                const buttonWrapper = document.createElement('div');
                buttonWrapper.className = 'action-button-wrapper';
                actionButton.render(buttonWrapper);
                actionsContainer.appendChild(buttonWrapper);
            }
        });
        container.appendChild(actionsContainer);
    }
    
    private __renderContent(container: HTMLElement, opts: INotificationOptions): void {
        const content = document.createElement('div');
        content.className = 'notification-content';
    
        const iconButton = this.__createNotificationIcon(opts.type);
        content.appendChild(iconButton);
    
        const message = document.createElement('div');
        message.className = 'notification-message';
        message.textContent = opts.message;
        content.appendChild(message);
    
        let hasSubMessage = false;
        let buttonsRendered = false; // Track if buttons are rendered
        
        if (opts.subMessage) {
            hasSubMessage = true;
            const subMessageActionsContainer = document.createElement('div');
            subMessageActionsContainer.className = 'submessage-actions-container';
    
            const subMessage = document.createElement('span');
            subMessage.className = 'notification-submessage';
            subMessage.textContent = opts.subMessage;
            subMessageActionsContainer.appendChild(subMessage);
    
            // Only render buttons with submessage if not rendered yet
            if (opts.actions && opts.actions.length && !buttonsRendered) {
                this.__renderCustomActionButtons(opts.actions, subMessageActionsContainer, true);
                buttonsRendered = true;
            }
            content.appendChild(subMessageActionsContainer);
        }
    
        // Render buttons only if not rendered already (when no submessage)
        if (opts.actions && opts.actions.length && !buttonsRendered) {
            this.__renderCustomActionButtons(opts.actions, content, false);
        }
    
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
            this.__closeNotification(container);
            container.remove();
        }));
        closeButton.render(closeButtonContainer);
        container.appendChild(closeButtonContainer);
    }

    private __createNotificationIcon(type?: INotificationTypes): HTMLElement {
        const iconElement = document.createElement('span');
        iconElement.className = 'notification-icon';

        const iconClass = this.__getIconClassForType(type);
        if (iconClass) {
            iconElement.classList.add(iconClass);
        }
        return iconElement;
    }

    private __getIconClassForType(type?: INotificationTypes): string {
        switch (type) {
            case INotificationTypes.Info:
                return Icons.NotificationInfo;
            case INotificationTypes.Warning:
                return Icons.NotificationWarn;
            case INotificationTypes.Error:
                return Icons.NotificationError;
            default:
                return 'notification-info'; // default
        }
    }
    
    private __closeNotification(notification: HTMLElement): void { 
        // Wait for the transitions to finish before removing the element
        notification.addEventListener('transitionend', () => {
            if (notification.parentNode === this._parent) {
                this._parent.removeChild(notification);
            }
        });
    }

    private __closeInfoNotification(notification: HTMLElement): void {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        
        // Wait for the transition to finish before calling closeNotification
        notification.addEventListener('transitionend', () => {
            this.__closeNotification(notification);
        });
    }
}