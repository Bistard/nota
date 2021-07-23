var isFileClicked = true;
var isOutlineClicked = false;

const folderBtn = document.getElementById('folderBtn');
const outlineBtn = document.getElementById('outlineBtn');
const folderTree = document.getElementById('folderTree');

folderBtnSelected(folderBtn, outlineBtn);

function folderBtnSelected(isFolderSelected) {
    if (isFolderSelected) {
        folderBtn.style.color = '#65655F';
        folderBtn.style.fontWeight = 'bold';
        folderBtn.style.borderBottom = '4px solid #5b5b55';
        folderTree.innerHTML = 'open a folder';
        outlineBtn.style.color = '#9f9f95';
        outlineBtn.style.fontWeight = 'normal';
        outlineBtn.style.borderBottom = '4px solid transparent';
    } else {
        outlineBtn.style.color = '#65655F';
        outlineBtn.style.fontWeight = 'bold';
        outlineBtn.style.borderBottom = '4px solid #5b5b55';
        folderTree.innerHTML = 'outline is empty';
        folderBtn.style.color = '#9f9f95';
        folderBtn.style.fontWeight = 'normal';
        folderBtn.style.borderBottom = '4px solid transparent';
    }
}

folderBtn.addEventListener('click', () => {
    if (isFileClicked == false) {
        isFileClicked = true;
        isOutlineClicked = false;
        folderBtnSelected(true);
    }
})

outlineBtn.addEventListener('click', () => {
    if (isOutlineClicked == false) {
        isOutlineClicked = true;
        isFileClicked = false;
        folderBtnSelected(false);
    }
})

