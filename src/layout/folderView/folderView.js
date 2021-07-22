var isFileClicked = true;
var isOutlineClicked = false;

const folderButton = document.getElementById('folderButton');
const outlineButton = document.getElementById('outlineButton');

buttonSelected(folderButton, outlineButton);

function buttonSelected (button, others) {
    button.style.color = '#65655F';
    button.style.fontWeight = 'bold';
    button.style.borderBottom = '4px solid #5b5b55';

    others.style.color = '#9f9f95';
    others.style.fontWeight = 'normal';
    others.style.borderBottom = '4px solid transparent';
}

folderButton.addEventListener('click', () => {
    if (isFileClicked == false) {
        isFileClicked = true;
        isOutlineClicked = false;
        buttonSelected(folderButton, outlineButton);
    }
})

outlineButton.addEventListener('click', () => {
    if (isOutlineClicked == false) {
        isOutlineClicked = true;
        isFileClicked = false;
        buttonSelected(outlineButton, folderButton);
    }
})

