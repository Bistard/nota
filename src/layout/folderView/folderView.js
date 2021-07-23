var isFileClicked = true;
var isOutlineClicked = false;

const folderBtn = document.getElementById('folderBtn');
const outlineBtn = document.getElementById('outlineBtn');

buttonSelected(folderBtn, outlineBtn);

function buttonSelected (button, others) {
    button.style.color = '#65655F';
    button.style.fontWeight = 'bold';
    button.style.borderBottom = '4px solid #5b5b55';

    others.style.color = '#9f9f95';
    others.style.fontWeight = 'normal';
    others.style.borderBottom = '4px solid transparent';
}

folderBtn.addEventListener('click', () => {
    if (isFileClicked == false) {
        isFileClicked = true;
        isOutlineClicked = false;
        buttonSelected(folderBtn, outlineBtn);
    }
})

outlineBtn.addEventListener('click', () => {
    if (isOutlineClicked == false) {
        isOutlineClicked = true;
        isFileClicked = false;
        buttonSelected(outlineBtn, folderBtn);
    }
})

