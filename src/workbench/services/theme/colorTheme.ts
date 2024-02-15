import { RGBA } from "src/base/common/color";
import { Dictionary, StringDictionary } from "src/base/common/utilities/type";
import { ColorThemeType } from "src/workbench/services/theme/theme";

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
}

export class ColorTheme implements IColorTheme {

    // [fields]

    public readonly type: ColorThemeType;
    public readonly name: string;
    public readonly description: string | undefined;

    private readonly _colors: StringDictionary<RGBA>;

    // [constructor]

    constructor(
        type: ColorThemeType,
        name: string,
        description: string | undefined,
        rawObj: Dictionary<string, any>,
    ) {
        this.type = type;
        this.name = name;
        this.description = description;
        
        this._colors = {};
        // init `this._colors` with `rawObj`
        Object.keys(rawObj).forEach(key => {
            const colorValue = rawObj[key];
            this._colors[key] = new RGBA(colorValue.r, colorValue.g, colorValue.b, colorValue.a);
        });
    }
    
    public getColor(id: string): RGBA | undefined {
        return this._colors[id];
    }

    // [public methods]
}