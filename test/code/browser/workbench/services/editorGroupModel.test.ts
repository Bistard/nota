import * as assert from 'assert';
import { suite, test } from 'mocha';
import { TextEditorPaneModel } from 'src/workbench/services/editorPane/editorPaneModel';
import { URI } from 'src/base/common/files/uri';
import { EditorGroupChangeType, EditorGroupModel, IEditorGroupChangeEvent, IEditorGroupCloseResult } from 'src/workbench/parts/workspace/editor/editorGroupModel';

suite('EditorGroupModel - Read-only Test', () => {

    let group!: EditorGroupModel;
    let editor1!: TextEditorPaneModel;
    let editor2!: TextEditorPaneModel;
    let editor3!: TextEditorPaneModel;

    suiteSetup(() => {
        group = new EditorGroupModel();
        editor1 = new TextEditorPaneModel(URI.parse('file://test1'));
        editor2 = new TextEditorPaneModel(URI.parse('file://test2'));
        editor3 = new TextEditorPaneModel(URI.parse('file://test3'));
        group.openEditor(editor1, {});
        group.openEditor(editor2, {});
        group.openEditor(editor3, {});
    });

    suite('getEditors', () => {
        test('should return editors in sequential order', () => {
            const editors = group.getEditors('sequential');
            assert.strictEqual(editors.length, 3);
            assert.strictEqual(editors[0], editor1);
            assert.strictEqual(editors[1], editor2);
            assert.strictEqual(editors[2], editor3);
        });

        test('should return editors in MRU order', () => {
            group.openEditor(editor2, {}); // Make editor2 the most recently used
            const editors = group.getEditors('mru');
            assert.strictEqual(editors[0], editor2);
            assert.strictEqual(editors[1], editor3);
            assert.strictEqual(editors[2], editor1);
        });
    });

    suite('getEditorByIndex', () => {
        test('should return the editor at the specified index', () => {
            assert.strictEqual(group.getEditorByIndex(0), editor1);
            assert.strictEqual(group.getEditorByIndex(1), editor2);
            assert.strictEqual(group.getEditorByIndex(2), editor3);
        });

        test('should return undefined for an out-of-bounds index', () => {
            assert.strictEqual(group.getEditorByIndex(-1), undefined);
            assert.strictEqual(group.getEditorByIndex(3), undefined);
        });
    });

    suite('find', () => {
        test('should return the editor and index if the editor exists', () => {
            const result = group.find(editor2);
            assert.strictEqual(result?.model, editor2);
            assert.strictEqual(result?.index, 1);
        });

        test('should return undefined if the editor does not exist', () => {
            const nonExistentEditor = new TextEditorPaneModel(URI.parse('file://nonexistent'));
            const result = group.find(nonExistentEditor);
            assert.strictEqual(result, undefined);
        });
    });

    suite('indexOf', () => {
        test('should return the index of the specified editor', () => {
            assert.strictEqual(group.indexOf(editor1), 0);
            assert.strictEqual(group.indexOf(editor2), 1);
            assert.strictEqual(group.indexOf(editor3), 2);
        });

        test('should return -1 if the editor does not exist', () => {
            const nonExistentEditor = new TextEditorPaneModel(URI.parse('file://nonexistent'));
            assert.strictEqual(group.indexOf(nonExistentEditor), -1);
        });
    });

    suite('contains', () => {
        test('should return true if the editor is in the group', () => {
            assert.strictEqual(group.contains(editor1), true);
            assert.strictEqual(group.contains(editor2), true);
            assert.strictEqual(group.contains(editor3), true);
        });

        test('should return false if the editor is not in the group', () => {
            const nonExistentEditor = new TextEditorPaneModel(URI.parse('file://nonexistent'));
            assert.strictEqual(group.contains(nonExistentEditor), false);
        });
    });

    suite('isFirst', () => {
        test('should return true for the first editor', () => {
            assert.strictEqual(group.isFirst(editor1), true);
        });

        test('should return false for non-first editors', () => {
            assert.strictEqual(group.isFirst(editor2), false);
            assert.strictEqual(group.isFirst(editor3), false);
        });
    });

    suite('isLast', () => {
        test('should return true for the last editor', () => {
            assert.strictEqual(group.isLast(editor3), true);
        });

        test('should return false for non-last editors', () => {
            assert.strictEqual(group.isLast(editor1), false);
            assert.strictEqual(group.isLast(editor2), false);
        });
    });
});

suite('EditorGroupModel - Writable Test', () => {

    suite('openEditor', () => {
        test('should add a new editor to the group', () => {
            const group = new EditorGroupModel();
            const editor = new TextEditorPaneModel(URI.parse('file://test'));

            assert.strictEqual(group.size, 0);
            const result = group.openEditor(editor, {});
            assert.strictEqual(group.size, 1);
            assert.strictEqual(result.model, editor);
            assert.strictEqual(result.existed, false);
        });

        test('should not duplicate an existing editor', () => {
            const group = new EditorGroupModel();
            const editor = new TextEditorPaneModel(URI.parse('file://test'));

            group.openEditor(editor, {});
            const result = group.openEditor(editor, {});
            assert.strictEqual(group.size, 1);
            assert.strictEqual(result.model, editor);
            assert.strictEqual(result.existed, true);
        });

        test('should move an existing editor to a new index if specified', () => {
            const group = new EditorGroupModel();
            const editor1 = new TextEditorPaneModel(URI.parse('file://test1'));
            const editor2 = new TextEditorPaneModel(URI.parse('file://test2'));

            group.openEditor(editor1, {});
            group.openEditor(editor2, {});
            assert.strictEqual(group.size, 2);

            const result = group.openEditor(editor1, { index: 1 });
            assert.strictEqual(group.size, 2);
            assert.strictEqual(result.existed, true);
            assert.strictEqual(group.getEditorByIndex(1), editor1);
        });
    });

    suite('closeEditor', () => {
        test('should remove an existing editor from the group', () => {
            const group = new EditorGroupModel();
            const editor = new TextEditorPaneModel(URI.parse('file://test'));

            group.openEditor(editor, {});
            const result = group.closeEditor(editor) as IEditorGroupCloseResult;

            assert.strictEqual(group.size, 0);
            assert.strictEqual(result.model, editor);
            assert.strictEqual(result.index, 0);
        });

        test('should return undefined if the editor does not exist', () => {
            const group = new EditorGroupModel();
            const editor = new TextEditorPaneModel(URI.parse('file://test'));

            const result = group.closeEditor(editor);
            assert.strictEqual(result, undefined);
        });
    });

    suite('moveEditor', () => {
        test('should move an editor to a specified index', () => {
            const group = new EditorGroupModel();
            const editor1 = new TextEditorPaneModel(URI.parse('file://test1'));
            const editor2 = new TextEditorPaneModel(URI.parse('file://test2'));

            group.openEditor(editor1, {});
            group.openEditor(editor2, {});
            assert.strictEqual(group.size, 2);

            const result = group.moveEditor(editor1, 1);

            assert.ok(result);
            assert.strictEqual(result.model, editor1);
            assert.strictEqual(result.from, 0);
            assert.strictEqual(result.to, 1);
            assert.strictEqual(group.getEditorByIndex(1), editor1);
        });

        test('should return undefined if the editor does not exist', () => {
            const group = new EditorGroupModel();
            const editor = new TextEditorPaneModel(URI.parse('file://test'));

            const result = group.moveEditor(editor, 1);
            assert.strictEqual(result, undefined);
        });

        test('should move nothing when moving to the same position', () => {
            const group = new EditorGroupModel();
            const editor = new TextEditorPaneModel(URI.parse('file://test'));

            group.openEditor(editor, {});
            const result = group.moveEditor(editor, -1)!;

            assert.strictEqual(result, undefined);
        });

        test('should clamp the target index to valid bounds', () => {
            const group = new EditorGroupModel();
            const editor1 = new TextEditorPaneModel(URI.parse('file://test1'));
            const editor2 = new TextEditorPaneModel(URI.parse('file://test2'));

            group.openEditor(editor1, {});
            group.openEditor(editor2, {});
            assert.strictEqual(group.size, 2);

            const result = group.moveEditor(editor1, 10);

            assert.ok(result);
            assert.strictEqual(result.from, 0);
            assert.strictEqual(result.to, 2);
            assert.strictEqual(result.model, editor1);
        });
    });
});

suite('EditorGroupModel - Event Test', () => {

    let group: EditorGroupModel;
    let editor1: TextEditorPaneModel;
    let editor2: TextEditorPaneModel;
    let editor3: TextEditorPaneModel;

    setup(() => {
        group = new EditorGroupModel();
        editor1 = new TextEditorPaneModel(URI.parse('file://test1'));
        editor2 = new TextEditorPaneModel(URI.parse('file://test2'));
        editor3 = new TextEditorPaneModel(URI.parse('file://test3'));
    });

    test('should fire EDITOR_OPEN event with correct data', () => {
        let event!: IEditorGroupChangeEvent;
        group.onDidChangeModel(e => {
            event = e;
        });

        group.openEditor(editor1, { index: 0 });

        assert.ok(event);
        assert.strictEqual(event?.type, EditorGroupChangeType.EDITOR_OPEN);
        assert.strictEqual(event?.model, editor1);
        assert.strictEqual(event?.modelIndex, 0);
    });

    test('should fire EDITOR_CLOSE event with correct data', () => {
        group.openEditor(editor1, {});
        let event!: IEditorGroupChangeEvent;
        group.onDidChangeModel(e => {
            event = e;
        });

        group.closeEditor(editor1);

        assert.ok(event);
        assert.strictEqual(event?.type, EditorGroupChangeType.EDITOR_CLOSE);
        assert.strictEqual(event?.model, editor1);
        assert.strictEqual(event?.modelIndex, 0);
    });

    test('should fire EDITOR_MOVE event with correct data', () => {
        group.openEditor(editor1, {});
        group.openEditor(editor2, {});
        let event!: IEditorGroupChangeEvent;
        group.onDidChangeModel(e => {
            event = e;
        });

        group.moveEditor(editor1, 1);

        assert.ok(event);
        assert.strictEqual(event?.type, EditorGroupChangeType.EDITOR_MOVE);
        assert.strictEqual(event?.model, editor1);
        assert.strictEqual(event?.modelIndex, 1);
    });

    test('should not fire an event for non-existent editor close', () => {
        let eventFired = false;
        group.onDidChangeModel(() => {
            eventFired = true;
        });

        group.closeEditor(editor1);

        assert.strictEqual(eventFired, false);
    });

    test('should not fire an event for non-existent editor move', () => {
        let eventFired = false;
        group.onDidChangeModel(() => {
            eventFired = true;
        });

        group.moveEditor(editor1, 1);

        assert.strictEqual(eventFired, false);
    });
});
