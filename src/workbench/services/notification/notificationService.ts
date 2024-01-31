import { Disposable, IDisposable } from "src/base/common/dispose";
import { IService, createService } from "src/platform/instantiation/common/decorator";

export const INotificationService = createService<INotificationService>('notification-service');

/**
 * An interface only for {@link NotificationService}.
 */
export interface INotificationService extends IDisposable, IService {
    error(error: string | Error): void;
    confirm(title: string, message: string): Promise<boolean>;
}

/**
 * @class NotificationService
 * 
 * @note Use {@link IDialogService} for more modal way to request for user 
 * inputs.
 */
export class NotificationService extends Disposable implements INotificationService {

    // [fields]
    private readonly _parent: HTMLElement; // Define the parent HTMLElement where the notification UI will be attached
    declare _serviceMarker: undefined;
    
    // [constructor]
    constructor(parent: HTMLElement = document.body) { // Allow passing a parent HTMLElement, default to document.body
        super();
        this._parent = parent; // Assign the passed or default parent to the _parent field
        const element = document.createElement('div');
        element.className = 'notification-container'; // You might want to add styles for positioning and styling the notifications
        this._parent.appendChild(element); // Append the container to the parent
    }

    // [public methods]

    public error(error: string | Error): void {
        // Implementation to show error notifications
        throw new Error('Error method not implemented');
    }

    public confirm(title: string, message: string): Promise<boolean> {
        // Wrap the window.confirm call in a Promise
        return new Promise<boolean>((resolve) => {
            const result = window.confirm(`${title}\n\n${message}`);
            resolve(result);
        });
    }
    
    // [private helper methods]
    // Add any helper methods you might need for managing notifications
}