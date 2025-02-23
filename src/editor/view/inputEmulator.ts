import { IOnKeydownEvent, IOnTextInputEvent } from "src/editor/view/proseEventBroadcaster";


/**
 * A delegate to simulate certain user's input programmatically.
 * 
 * Consider the following difference:
 * 1. The workflow of user input might be:
 *      Keyboard Event -> Event Broadcasting -> Extension Handing -> Document Updates
 * 2. The workflow of program input:
 *      function call -> Document Updates
 * 
 * This is a problem for program input, the event is not broadcasting, so the
 * extensions and others cannot be notified.
 * 
 * This why we need a delegate to emulate related-functions by also broadcasting
 * them.
 */
export interface IEditorInputEmulator {
    type(event: IOnTextInputEvent): void;
    keydown(event: IOnKeydownEvent): void;
}