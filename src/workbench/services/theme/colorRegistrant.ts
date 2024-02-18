import { RGBA } from "src/base/common/color";
import { Dictionary } from "src/base/common/utilities/type";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";

/**
 * An interface only for {@link ColorRegistrant}
 */
export interface IColorRegistrant extends IRegistrant<RegistrantType> {
    
    /**
     * @description Register a color for a {@link location} in the theme
     * {@link themeID}.
     */
    registerColor(themeID: string, location: string, color: RGBA): void;
    
    /**
     * @description Return list of all registered colors.
     */
    getAllRegisteredColors(): string[];

}

export class ColorRegistrant implements IColorRegistrant{

    // [field]

    public readonly type = RegistrantType.Color;

    /**
     * A map that stores all the registered colors.
     */
    // private readonly _colors = Map<Location, IColorItems>;

    // [public methods]

    public initRegistrations(): void {
        // noop
    }

    public registerColor(themeID: string, location: string, color: RGBA): void {
        throw new Error("Method not implemented.");
    }

    public getAllRegisteredColors(): string[] {
        throw new Error("Method not implemented.");
    }
}