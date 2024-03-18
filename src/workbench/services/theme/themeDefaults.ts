import { ColorMap } from "src/base/common/color";
import { assert } from "src/base/common/utilities/panic";
import { THEME_COLORS } from "./themeColors";

export const defaultThemeColors: ColorMap = {
    "menu-border-color": assert(THEME_COLORS.ghostWhite),
    "sidebar-background-color": assert(THEME_COLORS.seaGreen),
    "search-bar-background": assert(THEME_COLORS.ghostWhite),
    "selection-colour": assert(THEME_COLORS.lightSkyBlue),
    "toolbar-container-background": assert(THEME_COLORS.ghostWhite),
    "light-menu-border-color": assert(THEME_COLORS.gainsboro),
};