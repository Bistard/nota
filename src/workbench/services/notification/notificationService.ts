import 'src/workbench/services/notification/media.scss';
import { Disposable, IDisposable } from "src/base/common/dispose";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { Button, IButtonOptions} from "src/base/browser/basic/button/button";
import { Icons } from 'src/base/browser/icon/icons';
import { panic } from "src/base/common/utilities/panic";
import { CancellablePromise } from 'src/base/common/utilities/async';
import { isDefined } from 'src/base/common/utilities/type';

export const INotificationService = createService<INotificationService>('notification-service');

export const enum NotificationTypes {
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
    readonly type: NotificationTypes;
    readonly message: string;
    readonly subMessage?: string;
    readonly actions?: INotificationAction[];
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
    // Track notifications
    private _notifications: {
        readonly element: HTMLElement;
        readonly cancelPromise?: CancellablePromise<void>;
    }[] = [];

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
        if (opts.type === NotificationTypes.Info) {
            const cancellablePromise = new CancellablePromise<void>((token) => {
                return new Promise<void>((resolve) => {
                    const timeoutId = setTimeout(() => {
                        resolve();
                    }, 10000);
                    token.onDidCancel(() => {
                        clearTimeout(timeoutId);
                    });
                });
            });

            this._notifications.push({
                element: notification,
                cancelPromise: cancellablePromise,
            });

            cancellablePromise.then(() => {
                this.__closeInfoNotification(notification);
                notification.classList.add('fade-out');

                // Remove from notifications array
                this._notifications = this._notifications.filter(n => n.element !== notification);
            }).catch((error) => {
                // TODO: handle error
            });
        }
    }

    // [private methods]  
    
    private __renderCustomActionButtons(actions: INotificationAction[], container: HTMLElement, hasSubMessage: boolean): void {
        if (!actions || actions.length === 0) {
            return;
        }
    
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'notification-custom-actions';
        actionsContainer.classList.add(
            hasSubMessage ? 'submessage-actions' : 'no-submessage-actions'
        );

        // Render up to 3 actions
        actions = actions.slice(0, 3);
        for (const action of actions) {
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
        
        if (isDefined(opts.subMessage)) {
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

    private __createNotificationIcon(type: NotificationTypes): HTMLElement {
        const iconElement = document.createElement('span');
        iconElement.className = 'notification-icon';

        const iconClass = this.__getIconClassByType(type);
        iconElement.classList.add(iconClass);

        return iconElement;
    }

    private __getIconClassByType(type?: NotificationTypes): string {
        switch (type) {
            case NotificationTypes.Info:
                return Icons.NotificationInfo;
            case NotificationTypes.Warning:
                return Icons.NotificationWarn;
            case NotificationTypes.Error:
                return Icons.NotificationError;
            default:
                return Icons.NotificationInfo;
        }
    }
    
    private __closeNotification(notification: HTMLElement): void { 
        // Wait for the transitions to finish before removing the element
        notification.addEventListener('transitionend', () => {
            if (notification.parentNode === this._container) {
                this._container.removeChild(notification);
            }
        });
    }

    private __closeInfoNotification(notification: HTMLElement): void {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        this.__closeNotification(notification);
    }
}