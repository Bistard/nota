import { ICommandRegistrant } from "src/code/platform/command/common/commandRegistrant";
import { Registrants } from "src/code/platform/registrant/common/registrant";

const registrant = Registrants.get(ICommandRegistrant);

export const enum Cmd {

}

registrant.registerCommand('workbench.switch', (provider) => {
    
});