const fs = require('fs');
const path = require('path');

class FolderTree {
    constructor() {
        
    }

    getFolderTree(filePath) {

        const baseName = path.basename(filePath)
    
        if (fs.lstatSync(filePath).isDirectory()) {
    
            let name = baseName.replace(/_/g, ' ')
            const node = {
                nodes: {},
                isFolder: true,
                name,
                baseName,
            }
    
            const files = fs.readdirSync(filePath)
            files.forEach(file => {
                const tree = this.getFolderTree(path.join(filePath, file));
                if (tree && (!tree.isFolder || (tree.nodes && Object.values(tree.nodes).length > 0))) {
                    node.nodes[(tree.isFolder ? '0-' : '1-') + file] = tree;
                }
            })
            return node

        } else {
            if (/\.md$/i.test(filePath)) {
                let name = baseName.replace(/_/g, ' ').replace(/\.md$/, '').trim();
                return { name, baseName, filePath}
            }
        }
        return null
    }

    getFolderTreeList(tree, list = []) {
        if (tree.isFolder) {
			for (const [key, node] of Object.entries(tree.nodes)) {
				this.getFolderTreeList(node, list);
			}
		} else {
			list.push(tree.filePath);
		}
		return list;
    }

}

module.exports = { FolderTree }