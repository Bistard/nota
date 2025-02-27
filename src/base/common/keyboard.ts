import { PLATFORM, Platform } from "src/base/common/platform";

export type KeyboardModifier = 'Ctrl' | 'Shift' | 'Alt' | 'Meta';

/**
 * Used to compare with {@link MouseEvent.button}.
 */
export const enum MouseClick {
    leftClick = 0,
    middleClick = 1,
    rightClick = 2
}

/**
 * @description A collection of helper functions that relates to {@link KeyCode}.
 */
export namespace Keyboard {

    /**
     * @description Determines if the given key is {@link KeyboardModifier}.
     * @param key The given {@link KeyCode}.
     */
    export function isModifier(key: KeyCode | string): boolean {
        if (typeof key === 'number') {
            switch (key) {
                case KeyCode.Ctrl:
                case KeyCode.Shift:
                case KeyCode.Alt:
                case KeyCode.Meta:
                    return true;
                default:
                    return false;
            }
        } else {
            switch (key.toLowerCase()) {
                case 'ctrl':
                case 'shift':
                case 'alt':
                case 'meta':
                    return true;
                default:
                    return false;
            }
        }
    }

    /**
     * @description If the given {@link IStandardKeyboardEvent} contains modifier.
     */
    export function isEventModifier(event: IStandardKeyboardEvent): boolean {
        return event.alt || event.ctrl || event.meta || event.shift || isModifier(event.key);
    }

    /**
     * @description Returns the string form of the {@link KeyCode}.
     * @param key The given keycode.
     */
    export function toString(key: KeyCode): string {
        return keyCodeStringMap.getString(key);
    }

    /**
     * @description Returns the corresponding {@link KeyCode}.
     * @param key The string form of the keycode or {@link KeyboardEvent.keycode}.
     */
    export function toKeyCode(strKeyOrEventKey: string | number): KeyCode {
        if (typeof strKeyOrEventKey === 'string') {
            return keyCodeStringMap.getKeyCode(strKeyOrEventKey);
        } else {
            return keyCodeMap.map[strKeyOrEventKey] || KeyCode.None;
        }
    }

    /**
     * @description Returns the {@link KeyCode} corresponding browser key code.
     * @param strKeyOrKeyCode The string form of the keycode or {@link KeyCode}.
     */
    export function toKeyCodeBrowser(strKeyOrKeyCode: string | number): number {
        
        const keyCode = typeof strKeyOrKeyCode === 'string' 
            ? keyCodeStringMap.getKeyCode(strKeyOrKeyCode) 
            : strKeyOrKeyCode;

        const keyCodeBrowser = keyNumberMap.map[keyCode];
        return keyCodeBrowser ?? -1;
    }

    /**
     * @description Determines if two {@link IStandardKeyboardEvent} are the same.
     */
    export function sameEvent(event1: IStandardKeyboardEvent, event2: IStandardKeyboardEvent): boolean {
        return event1.key === event2.key &&
            event1.alt === event2.alt &&
            event1.ctrl === event2.ctrl &&
            event1.meta === event2.meta &&
            event1.shift === event2.shift;
    }
    
    /**
     * @description Converts the given {@link IStandardKeyboardEvent} to a 
     * {@link Shortcut}.
     */
    export function eventToShortcut(event: IStandardKeyboardEvent): Shortcut {
        return new Shortcut(event.ctrl, event.shift, event.alt, event.meta, event.key);
    }

    /**
     * @description Converts the given {@link IStandardKeyboardEvent} to a nice
     * looking string form.
     * @example `Ctrl+Shift+R`
     */
    export function eventToString(event: IStandardKeyboardEvent): string {
        return new Shortcut(event.ctrl, event.shift, event.alt, event.meta, event.key).toString();
    }

}

/**
 * The standard keyboard event used across the application. Can only be 
 * constructed by {@link createStandardKeyboardEvent}.
 * (replace {@link KeyboardEvent}).
 */
export interface IStandardKeyboardEvent {
    
    readonly browserEvent: KeyboardEvent;
    readonly target: HTMLElement;

    // modifiers
    readonly ctrl: boolean;
    readonly shift: boolean;
    readonly alt: boolean;
    readonly meta: boolean;

    // pressed key
    readonly key: KeyCode;

    preventDefault(): void;
    stopPropagation(): void;
}

/**
 * @description The only valid way to generate {@link IStandardKeyboardEvent}.
 * @param event The original {@link KeyboardEvent}.
 */
export function createStandardKeyboardEvent(event: KeyboardEvent): IStandardKeyboardEvent {
    const keycode = Keyboard.toKeyCode(event.keyCode);

    return {
        browserEvent: event,
        target: event.target as HTMLElement,
        
        ctrl: event.ctrlKey || keycode === KeyCode.Ctrl,
        shift: event.shiftKey  || keycode === KeyCode.Shift,
        alt: event.altKey  || keycode === KeyCode.Alt,
        meta: event.metaKey  || keycode === KeyCode.Meta,

        key: keycode,

        preventDefault: () => {
            if (event && event.preventDefault) {
                event.preventDefault();
            }
        },
        stopPropagation: () => {
            if (event && event.stopPropagation) {
                event.stopPropagation();
            }
        }
    };
}

/**
 * The standard key code used to represent the keyboard pressing which may from 
 * different operating systems.
 * 
 * @note This is NOT the same keycode used in browser event. For example, 
 *       `KeyCode.Enter` is `60`, but browser uses `13` to represent `Enter`.
 */
export const enum KeyCode {
    
    None = 0,

    F1,          // F1
    F2,          // F2
    F3,          // F3
    F4,          // F4
    F5,          // F5
    F6,          // F6
    F7,          // F7
    F8,          // F8
    F9,          // F9
    F10,        // F10
    F11,        // F11
    F12,        // F12
    F13,        // F13
	F14,        // F14
	F15,        // F15
	F16,        // F16
	F17,        // F17
	F18,        // F18
	F19,        // F19
        
    Digit1,     // 1
    Digit2,     // 2
    Digit3,     // 3
    Digit4,     // 4
    Digit5,     // 5
    Digit6,     // 6
    Digit7,     // 7
    Digit8,     // 8
    Digit9,     // 9
    Digit0,     // 0

    KeyA,       // A
    KeyB,       // B
    KeyC,       // C
    KeyD,       // D
    KeyE,       // E
    KeyF,       // F
    KeyG,       // G
    KeyH,       // H
    KeyI,       // I
    KeyJ,       // J
    KeyK,       // K
    KeyL,       // L
    KeyM,       // M
    KeyN,       // N
    KeyO,       // O
    KeyP,       // P
    KeyQ,       // Q
    KeyR,       // R
    KeyS,       // S
    KeyT,       // T
    KeyU,       // U
    KeyV,       // V
    KeyW,       // W
    KeyX,       // X
    KeyY,       // Y
    KeyZ,       // Z
    
    Ctrl,
    Shift,
    Alt,
    Meta,

    Enter,
    Escape,
    Backspace,
    Tab,
    Space,          //  
    Minus,          // -
    Equal,          // =
    BracketLeft,    // [
    BracketRight,   // ]
    Backslash,      // /
    Semicolon,      // ;
    Quote,          // '
    BackQuote,      // `
    Comma,          // ,
    Period,         // .
    Slash,          // /
    CapsLock,
    ScrollLock,
    PauseBreak,
    Insert,
    Home,
    PageUp,
    PageDown,
    Delete,
    End,
    RightArrow,
    LeftArrow,
    DownArrow,
    UpArrow,
    NumLock,
    ContextMenu,

    Numpad1,
    Numpad2,
    Numpad3,
    Numpad4,
    Numpad5,
    Numpad6,
    Numpad7,
    Numpad8,
    Numpad9,
    Numpad0,
}

/**
 * @internal A mapping from the browser keycode to {@link KeyCode}.
 */
class KeyCodeMap {
    public map: { [keyCode: number]: KeyCode } = new Array(250);
}

/**
 * @internal A mapping from our {@link KeyCode} to browser keycode.
 */
class KeyNumberMap {
    public map: { [keyCode: number]: number } = new Array(250);
}

/**
 * @internal A mapping either from {@link KeyCode} to the string form of keycode 
 * OR string to {@link KeyCode}.
 */
class KeyCodeStringMap {

    private codeToStr: string[] = [];
	private strToCode: { [str: string]: KeyCode; } = Object.create(null);

    constructor() {}

    public set(code: KeyCode, str: string): void {
        this.codeToStr[code] = str;
        this.strToCode[str] = code;
    }

    public getKeyCode(str: string): KeyCode {
        return this.strToCode[str] || KeyCode.None;
    }

    public getString(code: KeyCode): string {
        return this.codeToStr[code] || '';
    }
}

const keyCodeMap = new KeyCodeMap();
const keyNumberMap = new KeyNumberMap();
const keyCodeStringMap = new KeyCodeStringMap();

/** @internal */
for (const [keycode, keycodeNum, keycodeStr] of <[number, number, string][]>
[
    [KeyCode.None,    0, 'None'],
    [KeyCode.F1,  112, 'F1'],
    [KeyCode.F2,  113, 'F2'],
    [KeyCode.F3,  114, 'F3'],
    [KeyCode.F4,  115, 'F4'],
    [KeyCode.F5,  116, 'F5'],
    [KeyCode.F6,  117, 'F6'],
    [KeyCode.F7,  118, 'F7'],
    [KeyCode.F8,  119, 'F8'],
    [KeyCode.F9,  120, 'F9'],
    [KeyCode.F10, 121, 'F10'],
    [KeyCode.F11, 122, 'F11'],
    [KeyCode.F12, 123, 'F12'],
    [KeyCode.F13, 124, 'F13'],
    [KeyCode.F14, 125, 'F14'],
    [KeyCode.F15, 126, 'F15'],
    [KeyCode.F16, 127, 'F16'],
    [KeyCode.F17, 128, 'F17'],
    [KeyCode.F18, 129, 'F18'],
    [KeyCode.F19, 130, 'F19'],

    [KeyCode.Digit1, 49, '1'],
    [KeyCode.Digit2, 50, '2'],
    [KeyCode.Digit3, 51, '3'],
    [KeyCode.Digit4, 52, '4'],
    [KeyCode.Digit5, 53, '5'],
    [KeyCode.Digit6, 54, '6'],
    [KeyCode.Digit7, 55, '7'],
    [KeyCode.Digit8, 56, '8'],
    [KeyCode.Digit9, 57, '9'],
    [KeyCode.Digit0, 48, '0'],

    [KeyCode.KeyA, 65, 'A'],
    [KeyCode.KeyB, 66, 'B'],
    [KeyCode.KeyC, 67, 'C'],
    [KeyCode.KeyD, 68, 'D'],
    [KeyCode.KeyE, 69, 'E'],
    [KeyCode.KeyF, 70, 'F'],
    [KeyCode.KeyG, 71, 'G'],
    [KeyCode.KeyH, 72, 'H'],
    [KeyCode.KeyI, 73, 'I'],
    [KeyCode.KeyJ, 74, 'J'],
    [KeyCode.KeyK, 75, 'K'],
    [KeyCode.KeyL, 76, 'L'],
    [KeyCode.KeyM, 77, 'M'],
    [KeyCode.KeyN, 78, 'N'],
    [KeyCode.KeyO, 79, 'O'],
    [KeyCode.KeyP, 80, 'P'],
    [KeyCode.KeyQ, 81, 'Q'],
    [KeyCode.KeyR, 82, 'R'],
    [KeyCode.KeyS, 83, 'S'],
    [KeyCode.KeyT, 84, 'T'],
    [KeyCode.KeyU, 85, 'U'],
    [KeyCode.KeyV, 86, 'V'],
    [KeyCode.KeyW, 87, 'W'],
    [KeyCode.KeyX, 88, 'X'],
    [KeyCode.KeyY, 89, 'Y'],
    [KeyCode.KeyZ, 90, 'Z'],

    [KeyCode.Ctrl,  17, 'Ctrl'],
    [KeyCode.Shift, 16, 'Shift'],
    [KeyCode.Alt,   18, 'Alt'],
    [KeyCode.Meta,   0, 'Meta'],

    [KeyCode.Enter,         13, 'Enter'],
    [KeyCode.Escape,        27, 'Escape'],
    [KeyCode.Backspace,      8, 'Backspace'],
    [KeyCode.Tab,            9, 'Tab'],
    [KeyCode.Space,         32, 'Space'],
    [KeyCode.Minus,        189, '-'],
    [KeyCode.Equal,        187, '='],
    [KeyCode.BracketLeft,  219, '['],
    [KeyCode.BracketRight, 221, ']'],
    [KeyCode.Backslash,    220, '\\'],
    [KeyCode.Semicolon,    186, ';'],
    [KeyCode.Quote,        222, '\''],
    [KeyCode.BackQuote,    192, '`'],
    [KeyCode.Comma,        188, ','],
    [KeyCode.Period,       190, '.'],
    [KeyCode.Slash,        191, '/'],
    [KeyCode.CapsLock,      20, 'CapsLock'],
    [KeyCode.ScrollLock,   145, 'ScrollLock'],
    [KeyCode.PauseBreak,    19, 'PauseBreak'],
    [KeyCode.Insert,        45, 'Insert'],
    [KeyCode.Home,          36, 'Home'],
    [KeyCode.PageUp,        33, 'PageUp'],
    [KeyCode.PageDown,      34, 'PageDown'],
    [KeyCode.Delete,        46, 'Delete'],
    [KeyCode.End,           35, 'End'],
    [KeyCode.RightArrow,    39, '→'],
    [KeyCode.LeftArrow,     37, '←'],
    [KeyCode.DownArrow,     40, '↓'],
    [KeyCode.UpArrow,       38, '↑'],
    [KeyCode.NumLock,      144, 'NumLock'],
    [KeyCode.ContextMenu,   93, 'ContextMenu'],
]) {
    keyCodeMap.map[keycodeNum] = keycode;
    keyNumberMap.map[keycode] = keycodeNum;
    keyCodeStringMap.set(keycode, keycodeStr);
}

const enum BinaryShortcutMask {
	CtrlCmd = (1 << 11) >>> 0,
	Shift   = (1 << 10) >>> 0,
	Alt     = (1 << 9)  >>> 0,
	WinCtrl = (1 << 8)  >>> 0,
	KeyCode = 0x000000FF,
}

export type ShortcutHash = number;

/**
 * @class A simple class that represents a key binding.
 */
export class Shortcut {

    public static readonly None = Object.freeze(new Shortcut(false, false, false, false, KeyCode.None));

    public ctrl: boolean;
    public shift: boolean;
    public alt: boolean;
    public meta: boolean;
    public key: KeyCode;

    constructor(ctrl: boolean, shift: boolean, alt: boolean, meta: boolean, key: KeyCode) {
        this.ctrl = ctrl;
        this.shift = shift;
        this.alt = alt;
        this.meta = meta;
        this.key = key;
    }

    /**
     * @description Compares if the two shortcuts are the same.
     * @param other The other shortcut.
     */
    public equal(other: Shortcut): boolean {
        return this.ctrl === other.ctrl && 
               this.shift === other.shift && 
               this.alt === other.alt && 
               this.meta === other.meta && 
               this.key === other.key;
    }

    /**
     * @description Returns the string form of the shortcut.
     * @example 'Ctrl+shift+alt+D', 'Ctrl+PageDown', 'Alt+RightArrow', etc...
     */
    public toString(): string {
        let mask = 0;
        const result: string[] = [];
        
        if (this.ctrl) {
            mask |= KeyCode.Ctrl;
            result.push('Ctrl');
        }
        if (this.shift) {
            mask |= KeyCode.Shift;
            result.push('Shift');
        }
        if (this.alt) {
            mask |= KeyCode.Alt;
            result.push('Alt');
        }
        if (this.meta) {
            mask |= KeyCode.Meta;
            result.push('Meta');
        }
        
        if ((!Keyboard.isModifier(this.key) || (this.key | mask) !== mask) && 
            this.key !== KeyCode.None) 
        {
            const key = Keyboard.toString(this.key);
            result.push(key);
        }
        
        return result.join('+');
    }

    /**
     * @description Converts the string form of the shortcut to a {@link Shortcut}.
     * @note If the string is invalid, {@link Shortcut.None} is returned.
     * 
     * @example 'Ctrl+Shift+Alt+D', 'Ctrl+PageDown', 'Alt+RightArrow', etc...
     * @example 'ctrl+shift+alt+meta+R', 'SHIFT+CTRL+MEta+aLT+R', etc...
     * @example 'ctrl+A', 'meta+A', 'cmd+A' etc...
     */
    public static fromString(string: string): Shortcut {
        const shortcut = new Shortcut(false, false, false, false, KeyCode.None);
        const parts = string.split('+');
        for (const part of parts) {
            const lowerPart = part.toLowerCase();
            if (lowerPart === 'ctrl') {
                shortcut.ctrl = true;
            } else if (lowerPart === 'shift') {
                shortcut.shift = true;
            } else if (lowerPart === 'alt') {
                shortcut.alt = true;
            } else if (lowerPart === 'meta' || lowerPart === 'cmd') {
                shortcut.meta = true;
            } else {
                // duplicate main key found, we consider it as invalid shortcut.
                if (shortcut.key !== KeyCode.None) {
                    console.warn(`Invalid shortcut string (${string})`);
                    return Shortcut.None;
                }

                const key = Keyboard.toKeyCode(part);
                if (key !== KeyCode.None) {
                    shortcut.key = key;
                } else {
                    console.warn(`Invalid shortcut string (${string})`);
                    return Shortcut.None;
                }
            }
        }
        return shortcut;
    }

    public toHashcode(): ShortcutHash {
        const ctrl =  Number(this.ctrl)  << 11 >>> 0;
        const shift = Number(this.shift) << 10 >>> 0;
        const alt =   Number(this.alt)   << 9  >>> 0;
        const meta =  Number(this.meta)  << 8  >>> 0;
        return ctrl + shift + alt + meta + this.key;
    }

    public static fromHashcode(hashcode: ShortcutHash, os: Platform = PLATFORM): Shortcut {
        
        const ctrlCmd = (hashcode & BinaryShortcutMask.CtrlCmd ? true : false);
        const winCtrl = (hashcode & BinaryShortcutMask.WinCtrl ? true : false);

        const ctrl = (os === Platform.Mac ? winCtrl : ctrlCmd);
        const shift = (hashcode & BinaryShortcutMask.Shift ? true : false);
        const alt = (hashcode & BinaryShortcutMask.Alt ? true : false);
        const meta = (os === Platform.Mac ? ctrlCmd : winCtrl);
        const keyCode = (hashcode & BinaryShortcutMask.KeyCode);

        return new Shortcut(ctrl, shift, alt, meta, keyCode);
    }
}
