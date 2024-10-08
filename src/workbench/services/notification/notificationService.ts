import 'src/workbench/services/notification/notification.scss';
import { Disposable, IDisposable } from "src/base/common/dispose";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { NotificationInstance } from 'src/workbench/services/notification/notificationInstance';
import { Arrays } from 'src/base/common/utilities/array';

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
    private readonly _notifications: NotificationInstance[];

    // [constructor]

    constructor(parent: HTMLElement = document.body) {
        super();
        this._parent = parent;
        this._notifications = [];

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
        const instance = new NotificationInstance(opts);
        this._notifications.push(instance);

        const element = instance.render();
        this._container.appendChild(element);

        const listener = instance.onClose(() => {
            Arrays.remove(this._notifications, instance);
            listener.dispose();
        });
    }
}
