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

        // test('should close a notification when the close button is clicked', () => {
        //     notificationService.notify({
        //         message: 'Test notification for close'
        //     });

        //     const closeButton = container.querySelector('.notification-close') as HTMLElement;
        //     assert.notStrictEqual(closeButton, null); // closeButton should not be null
        //     closeButton.click();

        //     const notifications = container.getElementsByClassName('notification');
        //     assert.strictEqual(notifications.length, 0);
        // });

        test('should execute callback when a notification button is clicked', () => {
            let callbackExecuted = false;
            const callback = () => { callbackExecuted = true; };

            notificationService.notify({
                message: 'Test notification with action',
                actions: [{
                    label: 'Test Button',
                    callback: callback
                }]
            });

            const button = container.querySelector('.notification-button') as HTMLElement;
            assert.notStrictEqual(button, null); // button should not be null
            button.click();

            assert.strictEqual(callbackExecuted, true);
        });

        // Add any other tests for the NotificationService here...

    });

    // ... other tests for your existing suite ...

});


