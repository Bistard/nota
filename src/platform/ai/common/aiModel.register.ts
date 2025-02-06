import { AI } from "src/platform/ai/common/ai";
import { TextDeepSeekModel } from "src/platform/ai/electron/deepSeekModel";
import { TextGPTModel } from "src/platform/ai/electron/GPTModel";
import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";

export const textModelRegister = createRegister(
    RegistrantType.AIModel,
    'textModelRegister',
    registrant => {
        // ChatGPT
        registrant.registerModel(
            AI.Modality.Text,
            AI.ModelName.ChatGPT,
            TextGPTModel,
        );
        // DeepSeek
        registrant.registerModel(
            AI.Modality.Text,
            AI.ModelName.DeepSeek,
            TextDeepSeekModel,
        );
    }
);