const { app }= require('electron')

// titleBar
const TITLE_BAR_HEIGHT = '100px'
const FOLDER_VIEW_WIDHT = 300

let OpenFolderDialogConfig = {
    defaultPath: app.getPath('desktop'),
    buttonLabel: 'open a file or folder',
    properties: [
        'openFile',/* not working here */
        'showHiddenFiles',
        /* 'openDirectory', */
    ],
}

module.exports = { OpenFolderDialogConfig }
