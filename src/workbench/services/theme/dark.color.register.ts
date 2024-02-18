import { RGBA } from "src/base/common/color";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";

export const rendererThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeColor',
    (registrant) => {
        // Example for dark theme
        registrant.registerColor('dark', "", RGBA.BLACK);
    },
);