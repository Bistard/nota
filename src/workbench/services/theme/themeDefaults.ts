import { ColorMap, RGBA } from "src/base/common/color";
import { assert } from "src/base/common/utilities/panic";

export const defaultThemeColors: ColorMap = {
    "menu-border-color": assert(RGBA.parse("#FFFFFF")),
    
    // Add more default theme colors as needed
};