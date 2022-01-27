/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { Scrollable } from 'src/base/common/scrollable';

suite('Scrollable-test', () => {
	test('inflates slider size', () => {
		let actual = new Scrollable(14, 339, 42423, 32787);

		assert.strictEqual(actual.getScrollPosition(), 32787);
		assert.strictEqual(actual.getViewportSize(), 339);
		assert.strictEqual(actual.getScrollbarSize(), 14);
		assert.strictEqual(actual.required(), true);
		assert.strictEqual(actual.getSliderSize(), 20);
		assert.strictEqual(actual.getSliderPosition(), 249);

		actual.setScrollPosition(32849);
		assert.strictEqual(actual.getScrollPosition(), 32849);
		assert.strictEqual(actual.getViewportSize(), 339);
		assert.strictEqual(actual.getScrollbarSize(), 14);
		assert.strictEqual(actual.required(), true);
		assert.strictEqual(actual.getSliderSize(), 20);
		assert.strictEqual(actual.getSliderPosition(), 249);
	});
});
