const { ipcRenderer } = require('electron')
const fs = require('fs')
const Path = require('path')

class FolderTree {
    constructor() {
        
    }

    getFolderTree(path) {
        const baseName = Path.basename(path)
        
        if (fs.lstatSync(path).isDirectory()) {
    
            let name = baseName.replace(/_/g, ' ')
            const node = {
                nodes: {},
                isFolder: true,
                name,
                baseName,
            }
    
            const files = fs.readdirSync(path, {
                encoding: 'utf8', /* default: utf8 */
                withFileTypes: false
            })

            files.forEach(file => {
                /* ipcRenderer.send('test', 'fileName: ' + file) */
                const tree = this.getFolderTree(Path.join(path, file))
                if (tree && (!tree.isFolder || (tree.nodes && Object.values(tree.nodes).length > 0))) {
                    node.nodes[/* (tree.isFolder ? '0-' : '1-') +  */file] = tree
                }
            })
            return node

        } else {
            if (/\.md$/i.test(path)) {
                let name = baseName.replace(/_/g, ' ').replace(/\.md$/, '').trim()
                return { name, baseName, path}
            }
        }
        return null
    }

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

module.exports = { FolderTree }