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
     * Retrieves a dictionary of all registered colors for a given theme.
     * 
     * This method returns a dictionary where the keys are locations within the theme, 
     * and the values are the corresponding RGBA color values that've been registered. 
     *
     * @param themeID The unique identifier for the theme.
     * @returns A Dictionary with locations as keys and RGBA color values as values. 
     */
    getRegisteredColorsBy(themeID: string): Dictionary<string, RGBA>;

    /**
     * Registers a location as part of a theme template.
     * 
     * @param location The location within the theme that needs to be included in 
     * the template.
     */
    registerTemplate(location: string): void;

    /**
     * Retrieves the set of all locations that are part of the theme template.
     * 
     * @returns A set containing all the locations that have been registered.
     */
    getTemplate(): Set<string>;
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

    public getRegisteredColorsBy(themeID: string): Dictionary<string, RGBA> {
        return this._colors[themeID] || {};
    }

    public registerTemplate(location: string): void {
        this._template.add(location);
    }

    public getTemplate(): Set<string> {
        return new Set(this._template);
    }
}