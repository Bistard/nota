import { ColorMap } from "src/base/common/color";
import { RGBA } from "src/base/common/color";
import { assert } from "src/base/common/utilities/panic";

export const THEME_COLORS = <const>{

    // primary (brand)

    teal:       assert(RGBA.parse('#2AA882')), // review: 青色
    mediumTeal: assert(RGBA.parse('#A3D0C3')),
    lightTeal:  assert(RGBA.parse('#D0EBE3')),
    white:      assert(RGBA.parse('#FFFFFF')),

    // primary (text)
    
    // light theme special
    seaGreen: new RGBA(60, 179, 113),
    ghostWhite: new RGBA(248, 248, 255),
    lightSkyBlue: new RGBA(179, 212, 252),
    lavenderBlush: new RGBA(255, 240, 245),
    gainsboro: new RGBA(220, 220, 220),
    
    // dark theme special
    onyx: new RGBA(13, 13, 13),
    charcoal: new RGBA(54, 69, 79),
    midnightBlue: new RGBA(25, 25, 112),
    ebony: new RGBA(85, 93, 80),
    outerSpace: new RGBA(41, 49, 51),
} satisfies ColorMap;

/**
 * A color mapping that is shared in the preset color themes.
 */
export const SHARED_COLORS_DEFAULT: ColorMap = {
    // TODO
};
