import { ColorMap } from "src/base/common/color";
import { RGBA } from "src/base/common/color";
import { assert } from "src/base/common/utilities/panic";

export const THEME_COLORS = <const>{

    // primary (brand)

    teal:                assert(RGBA.parse('#2aa882')),
    mediumTeal:          assert(RGBA.parse('#a3d0c3')),
    lightTeal:           assert(RGBA.parse('#d0ebe3')),
    lighterTeal:         assert(RGBA.parse('#f0f8f5')),
    white:               assert(RGBA.parse('#ffffff')),

    // primary (text)

    primary:             assert(RGBA.parse('#211f27')),
    secondary:           assert(RGBA.parse('#5a564d')),
    ternary:             assert(RGBA.parse('#949393')),
    subtext:             assert(RGBA.parse('#b5b5b5')),
    middle:              assert(RGBA.parse('#bbbbbb')),
    subicon:             assert(RGBA.parse('#cccccc')),
    stroke:              assert(RGBA.parse('#e2e2e2')),
    lightstroke:         assert(RGBA.parse('#eaeaea')),
    light:               assert(RGBA.parse('#fcf3f3')),
    sidebg:              assert(RGBA.parse('#fcfcfc')),

    // utility
    goldenrod:           assert(RGBA.parse('#F1AD00')),
    lightgoldenrod:     assert(RGBA.parse('#f9de99')),
    crimson:             assert(RGBA.parse('#DA3A34')),
    lightcrimson:       assert(RGBA.parse('#ec9c99')),
    
    // light theme special
    
    // dark theme special

} satisfies ColorMap;

/**
 * A color mapping that is shared in the preset color themes.
 */
export const SHARED_COLORS_DEFAULT: ColorMap = {
    // TODO
};
