import * as assert from 'assert';
import { suite, test } from 'mocha';
import { URI } from 'src/base/common/files/uri';
import { EditorPaneModel, TextEditorPaneModel } from 'src/workbench/services/editorPane/editorPaneModel';

suite('EditorPaneModel', () => {

    class TestEditorPaneModel extends EditorPaneModel {
        public readonly type = 'TestEditorPaneModel';
        public readonly resource: URI | undefined;

        constructor(resource?: URI) {
            super();
            this.resource = resource;
        }
    }

    suite('prefersWhich', () => {
        test('should return the first panel by default', () => {
            const model = new TestEditorPaneModel();
            const panels = [{ id: 'panel1' }, { id: 'panel2' }] as any;
            const result = model.prefersWhich(panels);
            assert.strictEqual(result, panels[0]);
        });
    });

    suite('equals', () => {
        test('should return true for the same instance', () => {
            const model = new TestEditorPaneModel();
            assert.strictEqual(model.equals(model), true);
        });

        test('should return false for a different instance', () => {
            const model1 = new TestEditorPaneModel();
            const model2 = new TestEditorPaneModel();
            assert.strictEqual(model1.equals(model2), false);
        });
    });

    suite('getInfoString', () => {
        test('should return formatted string with type and resource', () => {
            const uri = URI.parse('file://path/to/resource');
            const model = new TestEditorPaneModel(uri);
            const infoString = model.getInfoString();
            assert.strictEqual(infoString, `EditorPaneModel "TestEditorPaneModel" "file://path/to/resource"`);
        });

        test('should return formatted string with type and undefined resource', () => {
            const model = new TestEditorPaneModel();
            const infoString = model.getInfoString();
            assert.strictEqual(infoString, `EditorPaneModel "TestEditorPaneModel" "undefined"`);
        });
    });
});

suite('TextEditorPaneModel', () => {
    test('should have type "TextEditorPaneModel"', () => {
        const uri = URI.parse('file://path/to/resource');
        const model = new TextEditorPaneModel(uri);
        assert.strictEqual(model.type, 'TextEditorPaneModel');
    });

    test('should store the given resource', () => {
        const uri = URI.parse('file://path/to/resource');
        const model = new TextEditorPaneModel(uri);
        assert.strictEqual(model.resource, uri);
    });

    suite('equals', () => {
        test('should return true for models with the same resource', () => {
            const uri = URI.parse('file://path/to/resource');
            const model1 = new TextEditorPaneModel(uri);
            const model2 = new TextEditorPaneModel(uri);
            assert.strictEqual(model1.equals(model2), true);
        });

        test('should return false for models with different resources', () => {
            const uri1 = URI.parse('file://path/to/resource1');
            const uri2 = URI.parse('file://path/to/resource2');
            const model1 = new TextEditorPaneModel(uri1);
            const model2 = new TextEditorPaneModel(uri2);
            assert.strictEqual(model1.equals(model2), false);
        });
    });
});
