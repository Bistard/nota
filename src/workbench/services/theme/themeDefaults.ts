import { ColorMap } from "src/base/common/color";
import { RGBA } from "src/base/common/color";

export const THEME_COLORS = {
    // default colors

    // light theme special
    seaGreen: new RGBA(60, 179, 113),
    ghostWhite: new RGBA(248, 248, 255),
    lightSkyBlue: new RGBA(135, 206, 250),
    lavenderBlush: new RGBA(255, 240, 245),
    gainsboro: new RGBA(220, 220, 220),
    
    // dark theme special
    onyx: new RGBA(13, 13, 13),
    charcoal: new RGBA(54, 69, 79),
    midnightBlue: new RGBA(25, 25, 112),
    ebony: new RGBA(85, 93, 80),
    outerSpace: new RGBA(41, 49, 51),
} satisfies ColorMap;

export const SHARED_COLORS_DEFAULT: ColorMap = {
    // TODO
};
