import { TokenEnum } from "src/editor/common/markdown";
import { IEditorInputRuleExtension } from "src/editor/contrib/inputRuleExtension/inputRuleExtension";

export function registerDefaultInputRules(extension: IEditorInputRuleExtension): void {
    console.log("Registering default input rules"); // Add this line

    // Heading Rule: Matches "#" followed by a space
    extension.registerRule("headingRule", /^(#{1,6})\s$/, {
        nodeType: TokenEnum.Heading ,
        getNodeAttribute: (match) => {
            return { level: 1 };
        }
    });

    // Blockquote Rule: Matches ">" followed by a space
    extension.registerRule("blockquoteRule", /^>\s$/, { nodeType: TokenEnum.Blockquote });

    // Code Block Rule: Matches triple backticks
    extension.registerRule("codeBlockRule", /^```$/, { nodeType: TokenEnum.CodeBlock });
}   