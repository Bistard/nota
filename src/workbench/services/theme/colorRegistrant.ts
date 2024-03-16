import { ColorMap, RGBA } from "src/base/common/color";
import { Dictionary } from "src/base/common/utilities/type";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";

/**
 * An interface only for {@link ColorRegistrant}
 */
export interface IColorRegistrant extends IRegistrant<RegistrantType> {
    
    /**
     * @description Registers a color associated with a specific location within 
     * a given theme.
     * @param themeID The ID for the theme.
     * @param location The location in string form.
     * @param color The RGBA color value to be registered for the specified 
     * location within the theme.
     */
    registerColor(themeID: string, location: string, color: RGBA): void;

    /**
     * @description Retrieves a dictionary of all registered colors for a given 
     * theme.
     * @param themeID The ID for the theme.
     */
    getRegisteredColorMap(themeID: string): ColorMap;

    /**
     * @description Registers a location as essential for all themes.
     * @param location The location in string form.
     */
    registerTemplate(location: string): void;

    /**
     * @description Retrieves all mandatory locations for all themes.
     */
    getTemplate(): Set<string>;
}

export class ColorRegistrant implements IColorRegistrant{

    // [field]

    public readonly type = RegistrantType.Color;

    /**
     * Maintains a mapping of theme IDs to their corresponding {@link ColorMap}s.
     * Each {@link ColorMap} maps locations to their RGBA color.
     */
    private readonly _colors: Dictionary<string, ColorMap> = {};

    /**
     * Contains essential locations required by every theme.
     */
    private readonly _template = new Set<string>();

    // [public methods]

    public initRegistrations(): void {
        // noop    
    }

    public registerColor(themeID: string, location: string, color: RGBA): void {
        this._colors[themeID] ??= {};
        this._colors[themeID]![location] = color;
    }

    public getRegisteredColorMap(themeID: string): ColorMap {
        return this._colors[themeID] ?? {};
    }

    public registerTemplate(location: string): void {
        this._template.add(location);
    }

    public getTemplate(): Set<string> {
        return this._template;
    }
}