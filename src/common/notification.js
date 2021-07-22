const { Notification } = require('electron');

function displayNotificationTest() {
    new Notification('MarkdownNote Notification', { body: 'Hello World!' }).onclick = () => console.log('Notification clicked')
}

module.exports = { displayNotificationTest };