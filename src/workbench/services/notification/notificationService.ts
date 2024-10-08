import 'src/workbench/services/notification/notification.scss';
import { Disposable, IDisposable } from "src/base/common/dispose";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { NotificationInstance } from 'src/workbench/services/notification/notificationInstance';

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
        // Implement error logic here
        console.error(error);
    }

    public confirm(message: string, subMessage: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const result = window.confirm(`${message}\n\n${subMessage}`);
            resolve(result);
        });
    }

    public notify(opts: INotificationOptions): void {
        const notificationBox = new NotificationInstance(opts);
        const notificationElement = notificationBox.render();

        this._container.appendChild(notificationElement);

        if (opts.type === NotificationTypes.Info) {
            notificationBox.startAutoCloseScheduler();
        }
    }

    // [private methods]]
}
