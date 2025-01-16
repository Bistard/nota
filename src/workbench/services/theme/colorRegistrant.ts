import { Color, ColorMap } from "src/base/common/color";
import { panic } from "src/base/common/utilities/panic";
import { Dictionary } from "src/base/common/utilities/type";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { rendererDarkThemeColorRegister } from "src/workbench/services/workbench/dark.color.register";
import { rendererLightThemeColorRegister } from "src/workbench/services/workbench/light.color.register";
import { rendererThemeLocationRegister } from "src/workbench/services/workbench/location.color.register";

/**
 * An interface only for {@link ColorRegistrant}
 */
export interface IColorRegistrant extends IRegistrant<RegistrantType.Color> {
    
    /**
     * @description Registers a color associated with a specific location within 
     * a given theme.
     * @param themeID The ID for the theme.
     * @param location The location in string form.
     * @param color The {@link Color} to be registered for the specified 
     *              location within the theme.
     * @panic If duplicate register colors to the same location.
     */
    registerColor(themeID: string, location: string, color: Color): void;

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

export class ColorRegistrant implements IColorRegistrant {

    // [field]

    public readonly type = RegistrantType.Color;

    /**
     * Maintains a mapping of theme IDs to their corresponding {@link ColorMap}s.
     * Each {@link ColorMap} maps every location (string) to its {@link Color}.
     */
    private readonly _colors: Dictionary<string, ColorMap> = {};

    /**
     * Contains essential locations required by every theme.
     */
    private readonly _template = new Set<string>();

    // [public methods]

    public initRegistrations(provider: IServiceProvider): void {
        rendererThemeLocationRegister(provider);
        rendererLightThemeColorRegister(provider);
        rendererDarkThemeColorRegister(provider);
    }

    public registerColor(themeID: string, location: string, color: Color): void {
        this._colors[themeID] ??= {};
        const colorMap = this._colors[themeID]!;

        const existedColor = colorMap[location];
        if (existedColor) {
            panic(`[ColorRegistrant] The theme '${themeID}' has already registered the location '${location}' with the color '${existedColor.toString()}'.`);
        }

        colorMap[location] = color;
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