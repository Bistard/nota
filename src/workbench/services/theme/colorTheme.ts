import { ColorMap, RGBA } from "src/base/common/color";
import { assert } from "src/base/common/utilities/panic";
import { ColorThemeType, PresetColorTheme } from "src/workbench/services/theme/theme";
import { IRawThemeJsonReadingData } from "src/workbench/services/theme/themeService";

export function isPresetColorTheme(name: string): boolean {
    return name === PresetColorTheme.LightModern ||
           name === PresetColorTheme.DarkModern;
}

export const PRESET_COLOR_THEME_METADATA: { name: PresetColorTheme, type: ColorThemeType, description: string }[] = [
    {
        name: PresetColorTheme.LightModern,
        type: ColorThemeType.Light,
        description: 'Default theme (Light Modern)',
    },
    {
        name: PresetColorTheme.DarkModern,
        type: ColorThemeType.Dark,
        description: 'Default theme (Light Modern)',
    },
];

/**
 * Returns the css variable name for the given color identifier. Dots (`.`) are 
 * replaced with hyphens (`-`) and everything is prefixed with `--nota-`.
 *
 * @sample `navigationPanel.background` is `--nota-navigationPanel-background`.
 */
export function toCssVariableName(name: string): string {
    return `--nota-${name.replace(/\./g, '-')}`;
}

/**
 * A {@link IColorTheme} is a data structure that is constructed from a valid
 * JSON file. It contains color data for every UI components.
 */
export interface IColorTheme {

    /**
     * The type of the theme. This is useful to categorize themes.
     */
    readonly type: ColorThemeType;

    /**
     * The name of the theme.
     */
    readonly name: string;

    /**
     * The description of the theme. No descriptions if not provided.
     */
    readonly description?: string;

    /**
     * @description Resolves the color of the given color identifier.
     * @param id the id of the color.
     */
    getColor(id: string): RGBA | undefined;

    /**
     * // TODO
     */
    getColorMap(): ColorMap;
}

export class ColorTheme implements IColorTheme {

    // [fields]

    public readonly type: ColorThemeType;
    public readonly name: string;
    public readonly description: string | undefined;

    private readonly _colors: ColorMap;

    // [constructor]

    constructor(rawData: IRawThemeJsonReadingData) {
        this.type = rawData.type;
        this.name = rawData.name;
        this.description = rawData.description;
        this._colors = {};

        Object.entries(rawData.colors).forEach(([propName, hexOrRGBA]) => {
            this._colors[propName] = RGBA.is(hexOrRGBA) 
                ? hexOrRGBA 
                : assert(RGBA.parse(hexOrRGBA), `[ColorTheme] Cannot parse the raw data at the color '${propName}' with the hexadecimal '${hexOrRGBA}'`);
        });
    }
    
    // [public methods]

    public getColor(id: string): RGBA | undefined {
        return this._colors[id];
    }

    public getColorMap(): ColorMap {
        return this._colors;
    }
}