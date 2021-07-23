const { default : Vditor } = require('vditor');
/* const index = require('../../../node_modules/vditor/src/assets/scss/index.scss');

const vditor = new Vditor('Vditor');
 */menuButton.addEventListener('click', () => {
    ipcRenderer.send('test');
})