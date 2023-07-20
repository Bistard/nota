import * as assert from 'assert';
import { URI } from 'src/base/common/file/uri';
import { CreateTernarySearchTree, ITernarySearchTree, StringIterator, TernarySearchTree, TernarySearchTreeNode, UriIterator } from 'src/base/common/util/ternarySearchTree';

suite('ternarySearchTree-test', () => {
    
    function isbalanced(tree: ITernarySearchTree<any, any>): boolean {
        const nodeBalanced = (node: TernarySearchTreeNode<any, any> | undefined): boolean => {
            if (!node) {
                return true;
            }
            const bf = node.balanceFactor();
            if (bf < -1 || bf > 1) {
                return false;
            }
            return nodeBalanced(node.left) && nodeBalanced(node.right);
        };
        return nodeBalanced(tree.getRoot());
    }

    // Note: items must be in order. 
    function assertTstDfs<E>(tree: ITernarySearchTree<string, E>, ...items: [string, E][]) {
        assert.ok(isbalanced(tree), 'TST is not balanced');

        let i = 0;

		// iterator not tested yet, just confirming input
        for (const [key, value] of tree) {
            const expected = items[i++];
            assert.ok(expected);
            assert.strictEqual(key, expected[0]);
            assert.strictEqual(value, expected[1]);
        }

        assert.strictEqual(i, items.length);

        const map = new Map<string, E>();

        for (const [key, value] of items) {
            map.set(key, value);
        }

        // get
        map.forEach((value: E, key: string): void => {
            assert.ok(tree.has(key));
            assert.strictEqual(value, tree.get(key));
        });

        // foreach and iterator
        let count = 0;
        tree.forEach((value: E, key: string): void => {
            assert.ok(tree.has(key));
            assert.strictEqual(value, map.get(key));
            count++;
        });

        assert.strictEqual(map.size, count);

        count = 0;
        for (const [key, value] of tree) {
			assert.strictEqual(value, map.get(key));
			count++;
		}
		assert.strictEqual(map.size, count);
    }

	suite('string', () => {
		
		test('string-iterator', () => {
			const iter = new StringIterator();
			iter.reset('this');
			
			assert.strictEqual(iter.currItem(), 't');
			assert.strictEqual(iter.hasNext(), true);
			assert.strictEqual(iter.cmp('t'), 0);
	
			assert.ok(iter.cmp('a') < 0);
			assert.ok(iter.cmp('z') > 0);
			assert.strictEqual(iter.cmp('t'), 0);
	
			iter.next();
			assert.strictEqual(iter.currItem(), 'h');
			assert.strictEqual(iter.hasNext(), true);
			
			iter.next();
			assert.strictEqual(iter.hasNext(), true);
			iter.next();
			assert.strictEqual(iter.currItem(), 's');
			assert.strictEqual(iter.hasNext(), false);
			
			iter.next();
			assert.strictEqual(iter.currItem(), undefined);
	
			iter.reset('hello');
			assert.strictEqual(iter.currItem(), 'h');
			assert.strictEqual(iter.hasNext(), true);
		});

		test('set & get & has', () => {

			// get and has are tested in assertTstDfs function
			let tree = CreateTernarySearchTree.forStringKeys<number>();
			tree.set('foobar', 1);
			tree.set('foobaz', 2);
	
			assertTstDfs(tree, ['foobar', 1], ['foobaz', 2]); // longer
	
			tree = CreateTernarySearchTree.forStringKeys<number>();
			tree.set('foobar', 1);
			tree.set('fooba', 2);
			assertTstDfs(tree, ['fooba', 2], ['foobar', 1]); // shorter
	
			tree = CreateTernarySearchTree.forStringKeys<number>();
			tree.set('foo', 1);
			tree.set('foo', 2);
			assertTstDfs(tree, ['foo', 2]);
	
			tree = CreateTernarySearchTree.forStringKeys<number>();
			tree.set('foo', 1);
			tree.set('foobar', 2);
			tree.set('bar', 3);
			tree.set('foob', 4);
			tree.set('bazz', 5);
	
			assertTstDfs(tree,
				['bar', 3],
				['bazz', 5],
				['foo', 1],
				['foob', 4],
				['foobar', 2],
			);
		});
	
		test('delete', () => {
	
			let tree = new TernarySearchTree<string, number>(new StringIterator());
			tree.set('foo', 1);
			tree.set('foobar', 2);
			tree.set('bar', 3);
			assertTstDfs(tree, ['bar', 3], ['foo', 1], ['foobar', 2]);
			tree.delete('foo');
			assertTstDfs(tree, ['bar', 3], ['foobar', 2]);
			tree.delete('foobar');
			assertTstDfs(tree, ['bar', 3]);
	
			// superstr-delete
			tree = new TernarySearchTree<string, number>(new StringIterator());
			tree.set('foo', 1);
			tree.set('foobar', 2);
			tree.set('bar', 3);
			tree.set('foobarbaz', 4);
			tree.deleteSuperStrOf('foo');
			assertTstDfs(tree, ['bar', 3], ['foo', 1]);
	
			tree = new TernarySearchTree<string, number>(new StringIterator());
			tree.set('foo', 1);
			tree.set('foobar', 2);
			tree.set('bar', 3);
			tree.set('foobarbaz', 4);
			tree.deleteSuperStrOf('fo');
			assertTstDfs(tree, ['bar', 3]);
	
			tree = new TernarySearchTree<string, number>(new StringIterator());
			tree.set('foo', 1);
			tree.set('foobar', 2);
			tree.set('bar', 3);
			tree.deleteSuperStrOf('f');
			assertTstDfs(tree, ['bar', 3]);
	
			// bst delete
			tree = new TernarySearchTree<string, number>(new StringIterator());
			tree.set('d', 1);
			assertTstDfs(tree, ['d', 1]);
			tree.delete('d');
			assertTstDfs(tree);
	
			// delete node with two element
			tree.clear();
			tree.set('d', 1);
			tree.set('b', 1);
			tree.set('f', 1);
			assertTstDfs(tree, ['b', 1], ['d', 1], ['f', 1]);
			tree.delete('d');
			assertTstDfs(tree, ['b', 1], ['f', 1]);
	
			// single child node
			tree.clear();
			tree.set('d', 1);
			tree.set('b', 1);
			tree.set('f', 1);
			tree.set('e', 1);
			assertTstDfs(tree, ['b', 1], ['d', 1], ['e', 1], ['f', 1]);
			tree.delete('f');
			assertTstDfs(tree, ['b', 1], ['d', 1], ['e', 1]);
	
			// delete after avl-balance
			tree.clear();
			tree.set('d', 1);
			tree.set('b', 1);
			tree.set('f', 1);
			tree.set('e', 1);
			tree.set('z', 1);
			assertTstDfs(tree, ['b', 1], ['d', 1], ['e', 1], ['f', 1], ['z', 1]);

			// right, right
			tree.delete('b');
			assertTstDfs(tree, ['d', 1], ['e', 1], ['f', 1], ['z', 1]);
	
			tree.clear();
			tree.set('d', 1);
			tree.set('c', 1);
			tree.set('f', 1);
			tree.set('a', 1);
			tree.set('b', 1);
			assertTstDfs(tree, ['a', 1], ['b', 1], ['c', 1], ['d', 1], ['f', 1]);
	
			// left, left
			tree.delete('f');
			assertTstDfs(tree, ['a', 1], ['b', 1], ['c', 1], ['d', 1]);
	
			// mid
			tree.clear();
			tree.set('a', 1);
			tree.set('ad', 1);
			tree.set('ab', 1);
			tree.set('af', 1);
			tree.set('ae', 1);
			tree.set('az', 1);
			assertTstDfs(tree, ['a', 1], ['ab', 1], ['ad', 1], ['ae', 1], ['af', 1], ['az', 1]);
	
			tree.delete('ab');
			assertTstDfs(tree, ['a', 1], ['ad', 1], ['ae', 1], ['af', 1], ['az', 1]);
	
			tree.delete('a');
			assertTstDfs(tree, ['ad', 1], ['ae', 1], ['af', 1], ['az', 1]);
		});

		test('fill & clear', () => {
			const input: [string, number][] = [['foo', 0], ['bar', 1], ['bang', 2], ['bazz', 3]];
			const tree = CreateTernarySearchTree.forStringKeys();
			tree.seed = 0;

			tree.fill(input);
			for (const [key, value] of input) {
				assert.strictEqual(tree.get(key), value);
			}

			tree.clear();
			assert.strictEqual(tree.getRoot(), undefined);
			assert.strictEqual(tree.size(), 0);
		});
	
		test('size', () => {
			const tree = CreateTernarySearchTree.forStringKeys();
			tree.seed = 0;

			tree.fill([['foo', 0], ['bar', 1], ['bang', 2], ['bazz', 3]]);
	
			tree.set('foobar', 3);
			tree.set('foobar', 10);
			assert.strictEqual(tree.size(), 5);
			tree.delete('bar');
			assert.strictEqual(tree.size(), 4);
			tree.deleteSuperStrOf('f');
			assert.strictEqual(tree.size(), 2);
			tree.clear();
			assert.strictEqual(tree.size(), 0);
		});
	
		test('findSubStrOf', function () {
	
			const tree = CreateTernarySearchTree.forStringKeys<number>();
			tree.set('foo', 1);
			tree.set('foobar', 2);
			tree.set('foobaz', 3);
	
			assert.strictEqual(tree.findSubStrOf('f'), undefined);
			assert.strictEqual(tree.findSubStrOf('z'), undefined);
			assert.strictEqual(tree.findSubStrOf('foo'), 1);
			assert.strictEqual(tree.findSubStrOf('fooö'), 1);
			assert.strictEqual(tree.findSubStrOf('fooba'), 1);
			assert.strictEqual(tree.findSubStrOf('foobarr'), 2);
			assert.strictEqual(tree.findSubStrOf('foobazrr'), 3);
		});
	});

	suite('URI', () => {
		
		test('URI-iterator', () => {

			const iter = new UriIterator(false);
			iter.reset(URI.parse('file:///usr/bin/file.txt'));
	
			assert.strictEqual(iter.currItem(), 'file');
			// assert.strictEqual(iter.cmp('FILE'), 0);
			assert.strictEqual(iter.cmp('file'), 0);
			assert.strictEqual(iter.hasNext(), true);
			iter.next();
	
			assert.strictEqual(iter.currItem(), 'usr');
			assert.strictEqual(iter.hasNext(), true);
			iter.next();
	
			assert.strictEqual(iter.currItem(), 'bin');
			assert.strictEqual(iter.hasNext(), true);
			iter.next();
	
			assert.strictEqual(iter.currItem(), 'file.txt');
			assert.strictEqual(iter.hasNext(), false);
	
	
			iter.reset(URI.parse('file://share/usr/bin/file.txt?foo'));
	
			// scheme
			assert.strictEqual(iter.currItem(), 'file');
			// assert.strictEqual(iter.cmp('FILE'), 0);
			assert.strictEqual(iter.cmp('file'), 0);
			assert.strictEqual(iter.hasNext(), true);
			iter.next();
	
			// authority
			assert.strictEqual(iter.currItem(), 'share');
			assert.strictEqual(iter.cmp('SHARe'), 0);
			assert.strictEqual(iter.hasNext(), true);
			iter.next();
	
			// path
			assert.strictEqual(iter.currItem(), 'usr');
			assert.strictEqual(iter.hasNext(), true);
			iter.next();
	
			// path
			assert.strictEqual(iter.currItem(), 'bin');
			assert.strictEqual(iter.hasNext(), true);
			iter.next();
	
			// path
			assert.strictEqual(iter.currItem(), 'file.txt');
			assert.strictEqual(iter.hasNext(), true);
			iter.next();
	
			// query
			assert.strictEqual(iter.currItem(), 'foo');
			assert.strictEqual(iter.cmp('z') > 0, true);
			assert.strictEqual(iter.cmp('a') < 0, true);
			assert.strictEqual(iter.hasNext(), false);
		});
	
		test('set & get & has', function () {
	
			let tree = new TernarySearchTree<URI, number>(new UriIterator(false));
			tree.set(URI.parse('http://foo.bar/user/foo/bar'), 1);
			tree.set(URI.parse('http://foo.bar/user/foo?query'), 2);
			tree.set(URI.parse('http://foo.bar/user/foo?QUERY'), 3);
			tree.set(URI.parse('http://foo.bar/user/foo/flip/flop'), 3);
	
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/foo')), undefined);
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/user')), undefined);
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/user/foo/bar')), 1);
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/user/foo?query')), 2);
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/user/foo?Query')), undefined);
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/user/foo?QUERY')), 3);
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/user/foo/bar/boo')), undefined);
	
			assert.ok(!tree.has(URI.parse('http://foo.bar/foo')));
			assert.ok(!tree.has(URI.parse('http://foo.bar/user')));
			assert.ok(tree.has(URI.parse('http://foo.bar/user/foo/bar')));
			assert.ok(tree.has(URI.parse('http://foo.bar/user/foo?query')));
			assert.ok(!tree.has(URI.parse('http://foo.bar/user/foo?Query')));
			assert.ok(tree.has(URI.parse('http://foo.bar/user/foo?QUERY')));
			assert.ok(!tree.has(URI.parse('http://foo.bar/user/foo/bar/boo')));

			// casing
			tree = new TernarySearchTree<URI, number>(new UriIterator(true));
			tree.set(URI.parse('http://foo.bar/user/foo/bar'), 1);
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/USER/foo/bar')), 1);
	
			tree.set(URI.parse('foo://foo.bar/user/foo/bar'), 1);
			assert.strictEqual(tree.get(URI.parse('foo://foo.bar/USER/foo/bar')), 1);
		});

		test('delete', () => {
			const tree = new TernarySearchTree<URI, number>(new UriIterator(false));
			tree.set(URI.parse('http://foo.bar/user/foo/bar'), 1);
			tree.set(URI.parse('http://foo.bar/user/foo?query'), 2);
			tree.set(URI.parse('http://foo.bar/user/foo?QUERY'), 3);
			tree.set(URI.parse('http://foo.bar/user/foo/flip/flop'), 3);

			tree.delete(URI.parse('http://foo.bar/user/foo/bar'));
			tree.delete(URI.parse('http://foo.bar/user/foo?query'));

			assert.ok(!tree.has(URI.parse('http://foo.bar/user/foo/bar')));
			assert.ok(!tree.has(URI.parse('http://foo.bar/user/foo?query')));
		});
	
		test('fill & clear', () => {
			const tree = new TernarySearchTree<URI, number>(new UriIterator(false));
			tree.seed = 0;
			tree.fill([
				[URI.parse('http://foo.bar/user/foo/bar'), 1],
				[URI.parse('http://foo.bar/user/foo?query'), 2],
				[URI.parse('http://foo.bar/user/foo?QUERY'), 3],
				[URI.parse('http://foo.bar/user/foo/flip/flop'), 3],
			]);

			assert.strictEqual(tree.size(), 4);
			
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/user/foo/bar')), 1);
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/user/foo?query')), 2);
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/user/foo?QUERY')), 3);
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/user/foo/flip/flop')), 3);

			tree.clear();
			assert.strictEqual(tree.size(), 0);
		});

		test('size', () => {
			const tree = CreateTernarySearchTree.forUriKeys();
			tree.seed = 0;

			tree.fill([
				[URI.parse('http://foo.bar/user/foo/bar'), 1],
				[URI.parse('http://foo.bar/user/foo?query'), 2],
				[URI.parse('http://foo.bar/user/foo?QUERY'), 3],
				[URI.parse('http://foo.bar/user/foo/flip/flop'), 3],
			]);
	
			tree.set(URI.parse('http://foo.bar/user/foo/bar'), 3);
			assert.strictEqual(tree.get(URI.parse('http://foo.bar/user/foo/bar')), 3);
			assert.strictEqual(tree.size(), 4);
			
			tree.delete(URI.parse('http://foo.bar/user/foo/bar'));
			assert.strictEqual(tree.size(), 3);
			
			tree.clear();
			assert.strictEqual(tree.size(), 0);
		});

		test('findSubStrOf', function () {
			const tree = new TernarySearchTree<URI, number>(new UriIterator(false));
	
			tree.set(URI.fromFile('/user/foo/bar'), 1);
			tree.set(URI.fromFile('/user/foo'), 2);
			tree.set(URI.fromFile('/user/foo/flip/flop'), 3);
	
			assert.strictEqual(tree.findSubStrOf(URI.fromFile('/user/bar')), undefined);
			assert.strictEqual(tree.findSubStrOf(URI.fromFile('/user/foo')), 2);
			assert.strictEqual(tree.findSubStrOf(URI.fromFile('/user/foo/ba')), 2);
			assert.strictEqual(tree.findSubStrOf(URI.fromFile('/user/foo/far/boo')), 2);
			assert.strictEqual(tree.findSubStrOf(URI.fromFile('/user/foo/bar')), 1);
			assert.strictEqual(tree.findSubStrOf(URI.fromFile('/user/foo/bar/far/boo')), 1);
		});
	
		test('findSuperStrOf', function () {
	
			const tree = new TernarySearchTree<URI, number>(new UriIterator(false));
			tree.set(URI.fromFile('/user/foo/bar'), 1);
			tree.set(URI.fromFile('/user/foo'), 2);
			tree.set(URI.fromFile('/user/foo/flip/flop'), 3);
			tree.set(URI.fromFile('/usr/foo'), 4);
	
			let item: IteratorResult<[URI, number]>;
			let iter = tree.findSuperStrOf(URI.fromFile('/user'))!;
	
			item = iter.next();
			assert.strictEqual(item.value[1], 2);
			assert.strictEqual(item.done, false);
			item = iter.next();
			assert.strictEqual(item.value[1], 1);
			assert.strictEqual(item.done, false);
			item = iter.next();
			assert.strictEqual(item.value[1], 3);
			assert.strictEqual(item.done, false);
			item = iter.next();
			assert.strictEqual(item.value, undefined);
			assert.strictEqual(item.done, true);
	
			iter = tree.findSuperStrOf(URI.fromFile('/usr'))!;
			item = iter.next();
			assert.strictEqual(item.value[1], 4);
			assert.strictEqual(item.done, false);
	
			item = iter.next();
			assert.strictEqual(item.value, undefined);
			assert.strictEqual(item.done, true);
	
			iter = tree.findSuperStrOf(URI.fromFile('/'))!;
			item = iter.next();
			assert.strictEqual(item.value[1], 2);
			assert.strictEqual(item.done, false);
			item = iter.next();
			assert.strictEqual(item.value[1], 1);
			assert.strictEqual(item.done, false);
			item = iter.next();
			assert.strictEqual(item.value[1], 3);
			assert.strictEqual(item.done, false);
			item = iter.next();
			assert.strictEqual(item.value[1], 4);
			assert.strictEqual(item.done, false);
			item = iter.next();
			assert.strictEqual(item.value, undefined);
			assert.strictEqual(item.done, true);
	
			assert.strictEqual(tree.findSuperStrOf(URI.fromFile('/not')), undefined);
			assert.strictEqual(tree.findSuperStrOf(URI.fromFile('/us')), undefined);
			assert.strictEqual(tree.findSuperStrOf(URI.fromFile('/usrr')), undefined);
			assert.strictEqual(tree.findSuperStrOf(URI.fromFile('/userr')), undefined);
		});
	});
});