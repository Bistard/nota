const { ipcRenderer } = require('electron')
const fs = require('fs')
const Path = require('path')

class treeNode {
    constructor(nodes, 
                isFolder, 
                name, 
                baseName, 
                path, 
                level, 
                isExpand, 
                plainText) {
        Object.assign(this, {nodes, isFolder, name, baseName, path, level, isExpand, plainText})
    }
}
class FolderTreeModule {
    
    constructor() {
        this.tree = {}
        this.treeList = []
    }

    createFolderTree(path, lev) {

        const baseName = Path.basename(path)
        if (fs.lstatSync(path).isDirectory()) {
            
            let name = baseName.replace(/_/g, ' ')
            const node = new treeNode({}, true, name, baseName, path, lev, false, '')
            
            const files = fs.readdirSync(path, {
                encoding: 'utf8',
                withFileTypes: false
            })

            files.forEach(file => {
                const tree = this.createFolderTree(Path.join(path, file), lev + 1)
                node.nodes[file] = tree
            })
            return node

        } else if (/\.md$/i.test(path)) {
            let name = baseName.replace(/_/g, ' ').replace(/\.md$/, '').trim()
            return new treeNode({}, false, name, baseName, path, lev, false, '')
        }
        // reaches if no suffix or not .md
        return new treeNode({}, false, baseName, baseName, path, lev, false, '')
    }

    getFolderTreeList(tree, list = []) {
        if (tree.isFolder) {
            list.push(tree)
			for (const [key, node] of Object.entries(tree.nodes)) {
				this.getFolderTreeList(node, list)
			}
		} else {
			list.push(tree)
		}
		return list
    }

}

module.exports = { FolderTreeModule }