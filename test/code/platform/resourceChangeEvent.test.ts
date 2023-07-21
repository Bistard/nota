import * as assert from 'assert';
import { join } from 'src/base/common/file/path';
import { URI } from 'src/base/common/file/uri';
import { IS_WINDOWS } from 'src/base/common/platform';
import { IRawResourceChangeEvents, ResourceChangeType } from 'src/platform/files/common/watcher';
import { ResourceChangeEvent } from 'src/platform/files/common/resourceChangeEvent';

function toPath(this: Mocha.Suite, path: string): string {
	if (IS_WINDOWS) {
		return join('C:\\', this.fullTitle(), path);
	}
	return join('/', this.fullTitle(), path);
}

function toResource(this: Mocha.Suite, path: string): URI {
	if (IS_WINDOWS) {
		return URI.parse(join('C:\\', this.fullTitle(), path));
	}
	return URI.parse(join('/', this.fullTitle(), path));
}

suite('ResourceChangeEvent-test', function () {

	test('basic', () => {
		const changes: IRawResourceChangeEvents = {
			wrap: undefined!,
			events: [
				{ resource: toPath.call(this, '/foo/updated.txt'), type: ResourceChangeType.UPDATED },
				{ resource: toPath.call(this, '/foo/otherupdated.txt'), type: ResourceChangeType.UPDATED },
				{ resource: toPath.call(this, '/added.txt'), type: ResourceChangeType.ADDED },
				{ resource: toPath.call(this, '/bar/deleted.txt'), type: ResourceChangeType.DELETED },
				{ resource: toPath.call(this, '/bar/folder'), type: ResourceChangeType.DELETED },
				{ resource: toPath.call(this, '/BAR/FOLDER'), type: ResourceChangeType.DELETED }
			],
			anyAdded: true,
			anyDeleted: true,
			anyUpdated: true,
			anyDirectory: true,
			anyFile: true,
		};

		for (const ignorePathCasing of [false, true]) {

			const event = new ResourceChangeEvent(changes, ignorePathCasing);

			assert.ok(!event.match(toResource.call(this, '/foo'))); // match any types
			assert.ok(!event.match(toResource.call(this, '/foo'), [])); // match any types
			assert.ok(event.affect(toResource.call(this, '/foo'))); // match any types

			assert.ok(!event.match(toResource.call(this, '/foo'), [ResourceChangeType.UPDATED]));
			assert.ok(event.affect(toResource.call(this, '/foo'), [ResourceChangeType.UPDATED]));
			assert.ok(event.match(toResource.call(this, '/foo/updated.txt'), [ResourceChangeType.UPDATED]));
			assert.ok(event.affect(toResource.call(this, '/foo/updated.txt'), [ResourceChangeType.UPDATED]));
			assert.ok(event.match(toResource.call(this, '/foo/updated.txt'), [ResourceChangeType.UPDATED, ResourceChangeType.ADDED]));
			assert.ok(event.affect(toResource.call(this, '/foo/updated.txt'), [ResourceChangeType.UPDATED, ResourceChangeType.ADDED]));
			assert.ok(event.match(toResource.call(this, '/foo/updated.txt'), [ResourceChangeType.UPDATED, ResourceChangeType.ADDED, ResourceChangeType.DELETED]));

			// Fix
			assert.ok(!event.match(toResource.call(this, '/foo/updated.txt'), [ResourceChangeType.ADDED, ResourceChangeType.DELETED]));
			assert.ok(!event.match(toResource.call(this, '/foo/updated.txt'), [ResourceChangeType.ADDED]));
			assert.ok(!event.match(toResource.call(this, '/foo/updated.txt'), [ResourceChangeType.DELETED]));
			assert.ok(!event.affect(toResource.call(this, '/foo/updated.txt'), [ResourceChangeType.DELETED]));

			assert.ok(event.match(toResource.call(this, '/bar/folder'), [ResourceChangeType.DELETED]));
			assert.ok(event.match(toResource.call(this, '/BAR/FOLDER'), [ResourceChangeType.DELETED]));
			assert.ok(event.affect(toResource.call(this, '/BAR'), [ResourceChangeType.DELETED]));
			if (ignorePathCasing) {
				assert.ok(event.match(toResource.call(this, '/BAR/folder'), [ResourceChangeType.DELETED]));
				assert.ok(event.affect(toResource.call(this, '/bar'), [ResourceChangeType.DELETED]));
			} else {
				assert.ok(!event.match(toResource.call(this, '/BAR/folder'), [ResourceChangeType.DELETED]));
				assert.ok(event.affect(toResource.call(this, '/bar'), [ResourceChangeType.DELETED]));
			}
			assert.ok(event.match(toResource.call(this, '/bar/folder/somefile'), [ResourceChangeType.DELETED]));
			assert.ok(event.match(toResource.call(this, '/bar/folder/somefile/test.txt'), [ResourceChangeType.DELETED]));
			assert.ok(event.match(toResource.call(this, '/BAR/FOLDER/somefile/test.txt'), [ResourceChangeType.DELETED]));
			if (ignorePathCasing) {
				assert.ok(event.match(toResource.call(this, '/BAR/folder/somefile/test.txt'), [ResourceChangeType.DELETED]));
			} else {
				assert.ok(!event.match(toResource.call(this, '/BAR/folder/somefile/test.txt'), [ResourceChangeType.DELETED]));
			}
			assert.ok(!event.match(toResource.call(this, '/bar/folder2/somefile'), [ResourceChangeType.DELETED]));
		}
	});

	test('supports multiple changes on file tree', () => {
		for (const type of [ResourceChangeType.ADDED, ResourceChangeType.UPDATED, ResourceChangeType.DELETED]) {
			const changes: IRawResourceChangeEvents = {
				events: [
					{ resource: toPath.call(this, '/foo/bar/updated.txt'), type },
					{ resource: toPath.call(this, '/foo/bar/otherupdated.txt'), type },
					{ resource: toPath.call(this, '/foo/bar'), type },
					{ resource: toPath.call(this, '/foo'), type },
					{ resource: toPath.call(this, '/bar'), type },
					{ resource: toPath.call(this, '/bar/foo'), type },
					{ resource: toPath.call(this, '/bar/foo/updated.txt'), type },
					{ resource: toPath.call(this, '/bar/foo/otherupdated.txt'), type }
				],
				anyAdded: type === ResourceChangeType.ADDED,
				anyDeleted: type === ResourceChangeType.DELETED,
				anyUpdated: type === ResourceChangeType.UPDATED,
				anyDirectory: true,
				anyFile: true,
				wrap: function () { return new ResourceChangeEvent(this); }
			};

			for (const ignorePathCasing of [false, true]) {
				const event = new ResourceChangeEvent(changes, ignorePathCasing);

				for (const change of changes.events) {
					assert.ok(event.match(URI.parse(change.resource), [type]));
					assert.ok(event.affect(URI.parse(change.resource), [type]));
				}

				assert.ok(event.affect(toResource.call(this, '/foo'), [type]));
				assert.ok(event.affect(toResource.call(this, '/bar'), [type]));
				assert.ok(event.affect(toResource.call(this, '/'), [type]));
				assert.ok(!event.affect(toResource.call(this, '/foobar'), [type]));

				assert.ok(!event.match(toResource.call(this, '/some/foo/bar'), [type]));
				assert.ok(!event.affect(toResource.call(this, '/some/foo/bar'), [type]));
				assert.ok(!event.match(toResource.call(this, '/some/bar'), [type]));
				assert.ok(!event.affect(toResource.call(this, '/some/bar'), [type]));
			}
		}
	});
});