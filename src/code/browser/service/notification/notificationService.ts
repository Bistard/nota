import { Disposable, IDisposable } from "src/base/common/dispose";
import { createService } from "src/platform/instantiation/common/decorator";

export const INotificationService = createService<INotificationService>('notification-service');

/**
 * An interface only for {@link NotificationService}.
 */
export interface INotificationService extends IDisposable {

    error(error: string | Error): void;
}

/**
 * @class // TODO
 * 
 * @note Use {@link IDialogService} for more modal way to request for user 
 * inputs.
 */
export class NotificationService extends Disposable implements INotificationService {

    // [fields]

    // [cosntructor]

    constructor() {
        super();
    }

    // [public methods]

    public error(error: string | Error): void {
        throw new Error('not implemented');
    }

    // [private helper methods]
}