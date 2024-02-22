import { RGBA } from "src/base/common/color";
import { Dictionary } from "src/base/common/utilities/type";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";

/**
 * An interface only for {@link ColorRegistrant}
 */
export interface IColorRegistrant extends IRegistrant<RegistrantType> {
    
    /**
     * Registers a color associated with a specific location within a given theme.
     *
     * @param themeID The unique identifier for the theme.
     * @param location The specific location within the theme to which the color will 
     * be applied.
     * @param color The RGBA color value to be registered for the specified location 
     * within the theme.
     */
    registerColor(themeID: string, location: string, color: RGBA): void;

    /**
     * Retrieves a list of all colors registered for a given theme.
     *
     * @returns An array of string representations for each registered color, detailing
     * the theme, location, and RGBA value.
     */
    getAllRegisteredColors(): string[];
    
    // registerTemplate(location: string): void;

    getRegisteredColorsBy(themeID: string): Dictionary<string, RGBA>;
}

export class ColorRegistrant implements IColorRegistrant{

    // [field]

    public readonly type = RegistrantType.Color;

    /**
     * A map that stores all the registered colors.
     * The outer dictionary's keys are theme IDs, and each value is another dictionary
     * where the keys are locations and the values are RGBA colors.
     */
    private readonly _colors: Dictionary<string, Dictionary<string, RGBA>> = {};

    private readonly _template = new Set<string>();

    // [public methods]

    public initRegistrations(): void {
        // noop
        
    }

    public registerColor(themeID: string, location: string, color: RGBA): void {
        if (!this._colors[themeID]) {
            this._colors[themeID] = {};
        }
        this._colors[themeID]![location] = color;
    }
    
    public getAllRegisteredColors(): string[] {
        const allColors: string[] = [];

        for (const themeID in this._colors) {
            const locations = this._colors[themeID];       
            for (const location in locations) {
                const color = locations[location];
                if (color) {
                    const colorString = `Theme: ${themeID}, Location: ${location}, Color: rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
                    allColors.push(colorString);
                }
            }
        }
        return allColors;
    } 

    public getRegisteredColorsBy(themeID: string): Dictionary<string, RGBA> {
        // Check if the themeID exists in the registry and return its colors if present; 
        // otherwise, return an empty dictionary.
        return this._colors[themeID] || {};
    }
}