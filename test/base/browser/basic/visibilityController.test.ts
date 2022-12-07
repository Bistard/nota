import * as assert from 'assert';
import { VisibilityController } from 'src/base/browser/basic/visibilityController';

suite('VisibilityController-test', () => {

    test('onDidFocus / onDidBlur', async () => {
        const dom = document.createElement('div');
        document.body.appendChild(dom);

        const controller = new VisibilityController();
        controller.setDomNode(dom);
        assert.ok(dom.classList.contains('visible'));

        controller.setVisibility(true);
        assert.ok(dom.classList.contains('visible'));

        controller.setVisibility(false);
        assert.ok(dom.classList.contains('invisible'));

        controller.toggleFade(true, 'fade');
        assert.ok(dom.classList.contains('fade'));

        controller.toggleFade(false, 'fade');
        assert.ok(!dom.classList.contains('fade'));
    });
});