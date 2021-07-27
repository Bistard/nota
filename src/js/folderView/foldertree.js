const { ipcRenderer } = require('electron')
const fs = require('fs')
const Path = require('path')

class FolderTreeModule {
    
    constructor() {
        this.tree = null
        this.treeList = null
    }

    getFolderTree(path, lev) {

        const baseName = Path.basename(path)
        if (fs.lstatSync(path).isDirectory()) {
            let name = baseName.replace(/_/g, ' ')
            const node = {
                nodes: {},
                isFolder: true,
                name,
                baseName,
                level: lev,
            }
    
            const files = fs.readdirSync(path, {
                encoding: 'utf8',
                withFileTypes: false
            })

            files.forEach(file => {
                const tree = this.getFolderTree(Path.join(path, file), lev + 1)
                node.nodes[file] = tree
            })
            return node

        } else if (/\.md$/i.test(path)) {
            let name = baseName.replace(/_/g, ' ').replace(/\.md$/, '').trim()
            return { nodes: {}, isFolder: false, name: name, baseName: baseName, path: path, level: lev}
        }
        // reaches if no suffix or not .md
        return { nodes: {}, isFolder: false, name: baseName, baseName: baseName, path: path, level: lev}
    }

    // FIX
    getFolderTreeList(tree, list = []) {
        if (tree.isFolder) {
			for (const [key, node] of Object.entries(tree.nodes)) {
				this.getFolderTreeList(node, list)
			}
		} else {
			list.push(tree.path)
		}
		return list
    }

}

module.exports = { FolderTreeModule }