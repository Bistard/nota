
/**
 * The standard keyboard event used acroess the application .
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
    const keycode = getKeyCode(event.keyCode);

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
    }
}

/**
 * @description Given the keycode number from {@link KeyboardEvent}, returns the
 * corresponding {@link KeyCode}.
 * @param eventKeyCode {@link KeyboardEvent.keycode}
 */
export function getKeyCode(eventKeyCode: number): KeyCode {
    return keyCodeMap.map[eventKeyCode] || KeyCode.Unknown;
}

/**
 * @class A simple class that represents a key binding and treated as shortcut.
 */
export class Shortcut {

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

    public equal(other: Shortcut): boolean {
        return false;
    }

    public toString(): string {
        const ctrl = this.ctrl ? '1' : '0';
        const shift = this.ctrl ? '1' : '0';
        const alt = this.ctrl ? '1' : '0';
        const meta = this.ctrl ? '1' : '0';
        return ctrl + shift + alt + meta + this.key.toString();
    }

}

/**
 * The standard key code used to represent the keyboard pressing which may from 
 * different operating systems.
 */
export const enum KeyCode {
    
    Unknown = -1,
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
    Backquote,      // `
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
 * @internal
 */
class KeyCodeMap {
    public map: { [keyCode: number]: KeyCode } = new Array(150);
}

/**
 * @internal
 */
class KeyCodeStringMap {

    private codeToStr: string[] = [];
	private strToCode: { [str: string]: KeyCode; } = Object.create(null);

    constructor() {}

    public set(code: KeyCode, str: string): void {
        this.codeToStr[code] = str;
        this.strToCode[str] = code;
    }

    public keyCode(str: string): KeyCode {
        return this.strToCode[str] || KeyCode.Unknown;
    }

    public string(code: KeyCode): string {
        return this.codeToStr[code] || '';
    }
}

/** @internal */
const keyCodeMap = new KeyCodeMap();
const keyCodeStringMap = new KeyCodeStringMap();

/** @internal */
[
    [KeyCode.Unknown, 0, 'unknown'],
    [KeyCode.None,    0, 'none'],
    
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
    [KeyCode.Backquote,    192, '`'],
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
    [KeyCode.RightArrow,    39, 'RightArrow'],
    [KeyCode.LeftArrow,     37, 'LeftArrow'],
    [KeyCode.DownArrow,     40, 'DownArrow'],
    [KeyCode.UpArrow,       38, 'UpArrow'],
    [KeyCode.NumLock,      144, 'NumLock'],
    [KeyCode.ContextMenu,   93, 'ContextMenu'],
]
.forEach(row => {
    const keycode = row[0] as KeyCode;
    const keycodeNum = row[1] as number;
    const keycodeStr = row[2] as string;

    keyCodeMap.map[keycodeNum] = keycode;
    keyCodeStringMap.set(keycode, keycodeStr);
});