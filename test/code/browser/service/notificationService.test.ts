import * as assert from 'assert';
import { before, suite, test } from 'mocha';
import { INotificationService, NotificationService, INotificationOptions } from 'src/workbench/services/notification/notificationService'; // Make sure to adjust the import path
// ... other imports ...

suite('NotificationService-test', () => {

    // ... other setup code ...

    suite('NotificationService', () => {

        let notificationService: INotificationService;
        let container: HTMLElement;

        before(() => {
            // Setup the DOM container for notifications
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
            notificationService = new NotificationService(container);
        });

        test('should create a notification with a message', () => {
            notificationService.notify({
                message: 'Test notification message'
            });

            const notifications = container.getElementsByClassName('notification');
            assert.strictEqual(notifications.length, 1);
            // assert.strictEqual(notifications[0].textContent.includes('Test notification message'), true);
        });
    });

    // more tests

});
