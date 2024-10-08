import { INotificationOptions, INotificationAction, NotificationTypes } from './notificationService';
import { IDisposable, Disposable } from 'src/base/common/dispose';
import { Button, IButtonOptions } from 'src/base/browser/basic/button/button';
import { Icons } from 'src/base/browser/icon/icons';
import { isDefined } from 'src/base/common/utilities/type';
import { IUnbufferedScheduler, UnbufferedScheduler } from 'src/base/common/utilities/async';
import { Time } from 'src/base/common/date';

/**
 * @class Handles rendering related operations for a notification element.
 */
export class NotificationInstance extends Disposable implements IDisposable {

    // [fields]

    public readonly element: HTMLElement;
    private scheduler?: IUnbufferedScheduler<void>;

    // [constructor]

    constructor(private opts: INotificationOptions, scheduler?: IUnbufferedScheduler<void>) {
        super();
        this.element = document.createElement('div');
        this.element.className = `notification ${opts.type}`;
    }

    // [public methods]

    public render(): HTMLElement {
        this.__renderContent();
        this.__renderCloseButton();
        this.__setupHoverEvents();
        return this.element;
    }

    // Public method to start scheduler
    public startAutoCloseScheduler(): void {
        this.scheduler = new UnbufferedScheduler<void>(
            Time.sec(10),
            async () => {
                this.__closeNotification();
            }
        );
        this.scheduler?.schedule();
    }

    // [private methods]

    private __renderContent(): void {
        const content = document.createElement('div');
        content.className = 'notification-content';

        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'notification-icon-wrapper';

        const iconButton = this.__createNotificationIcon();
        iconWrapper.appendChild(iconButton);

        const message = document.createElement('div');
        message.className = 'notification-message';
        message.textContent = this.opts.message;

        content.appendChild(message);

        if (isDefined(this.opts.subMessage)) {
            const subMessageActionsContainer = document.createElement('div');
            subMessageActionsContainer.className = 'submessage-actions-container';

            const subMessage = document.createElement('span');
            subMessage.className = 'notification-submessage';
            subMessage.textContent = this.opts.subMessage;
            subMessageActionsContainer.appendChild(subMessage);

            if (this.opts.actions && this.opts.actions.length) {
                this.__renderCustomActionButtons(this.opts.actions, subMessageActionsContainer, true);
            }
            content.appendChild(subMessageActionsContainer);
        } else if (this.opts.actions && this.opts.actions.length) {
            this.__renderCustomActionButtons(this.opts.actions, content, false);
        }
        this.element.appendChild(iconWrapper);
        this.element.appendChild(content);
    }

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
        actions.slice(0, 3).forEach(action => {
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
        });

        container.appendChild(actionsContainer);
    }

    private __renderCloseButton(): void {
        const closeButtonContainer = document.createElement('div');
        closeButtonContainer.className = 'notification-close-container';

        const closeButtonOptions: IButtonOptions = {
            id: 'close',
            icon: Icons.Close,
            classes: ['notification-close-button']
        };

        const closeButton = new Button(closeButtonOptions);
        this.__register(closeButton.onDidClick(() => {
            this.__closeNotification();
            this.element.remove();
        }));
        const close_type = this.__getIconClassByType(this.opts.type);
        closeButtonContainer.className = close_type;
        closeButton.render(closeButtonContainer);

        this.element.appendChild(closeButtonContainer);
    }

    private __createNotificationIcon(): HTMLElement {
        const iconElement = document.createElement('span');
        iconElement.className = 'notification-icon';

        const iconClass = this.__getIconClassByType(this.opts.type);
        const iconButtonOptions: IButtonOptions = {
            id: this.opts.type,
            icon: iconClass,
            classes: [iconClass]
        };

        const iconButton = new Button(iconButtonOptions);
        iconButton.render(iconElement);

        return iconElement;
    }

    private __getIconClassByType(type: NotificationTypes): Icons {
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

    private __closeNotification(): void {
        this.element.classList.add('fade-out');
        this.element.style.opacity = '0';
        this.element.style.transition = 'opacity 0.5s';

        this.element.addEventListener('transitionend', () => {
            if (this.element.parentNode) {
                this.element.remove();
            }
        });
        this.scheduler?.dispose();
    }

    private __setupHoverEvents(): void {
        this.element.addEventListener('mouseenter', () => {
            if (this.scheduler) {
                this.scheduler.cancel();
            }
        });

        this.element.addEventListener('mouseleave', () => {
            if (this.scheduler) {
                this.scheduler.schedule();
            }
        });
    }
}