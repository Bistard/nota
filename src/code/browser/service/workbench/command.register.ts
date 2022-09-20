import { ICommandRegistrant } from "src/code/platform/command/common/commandRegistrant";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";

const registrant = REGISTRANTS.get(ICommandRegistrant);

export const enum Cmd {

}

registrant.registerCommand('workbench.switch', (provider) => {
    
});