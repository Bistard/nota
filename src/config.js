const { app }= require('electron');

// titleBar
const TITLE_BAR_HEIGHT = "100px";

var OpenFolderDialogConfig = {
    defaultPath: app.getPath("desktop"),
    buttonLabel: 'open a file or folder',
    properties: [
        'openFile',/* not working here */
        'showHiddenFiles',
        'openDirectory',
    ],
}

module.exports = { OpenFolderDialogConfig };
