import { create } from "domain";
import { RGBA } from "src/base/common/color";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";

export const rendererThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeColor',
    (registrant) => {
        // Just an example
        registrant.registerColor('light', 'sideView.background', RGBA.WHITE);
        registrant.registerColor('light', 'sideView.scrollbar.background', RGBA.WHITE);
        registrant.registerColor('light', 'sideView.scrollbar.background', RGBA.WHITE);
        registrant.registerColor('light', 'sideView.scrollbar.background', RGBA.WHITE);
        registrant.registerColor('light', 'sideView.scrollbar.background', RGBA.WHITE);
        registrant.registerColor('light', 'sideView.scrollbar.background', RGBA.WHITE);
        
        
        // new file: src/editor/**/color.register.ts
        registrant.registerColor('light', 'editor.background', RGBA.WHITE);
    },
);