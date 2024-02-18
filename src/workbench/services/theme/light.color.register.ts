import { RGBA } from "src/base/common/color";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";

export const rendererThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeColor',
    (registrant) => {
        // Example for light theme
        registrant.registerColor('light', "", RGBA.WHITE);
    },
);