import { ColorMap, RGBA } from "src/base/common/color";
import { iterProp } from "src/base/common/utilities/object";
import { assert } from "src/base/common/utilities/panic";
import { StringDictionary } from "src/base/common/utilities/type";
import { ColorThemeType } from "src/workbench/services/theme/theme";
import { IRawThemeJsonReadingData } from "src/workbench/services/theme/themeService";

/**
 * A {@link IColorTheme} is a data structure that is consructed from a valid
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
        iterProp(rawData.colors, propName => {
            const colorInHex = rawData.colors[propName]!;
            this._colors[propName] = assert(RGBA.parse(colorInHex));
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