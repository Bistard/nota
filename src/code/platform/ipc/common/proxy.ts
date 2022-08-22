import { Register } from "src/base/common/event";
import { CharCode } from "src/base/common/util/char";
import { IChannel, IServerChannel } from "src/code/platform/ipc/common/channel";

/**
 * A namespace that provide functionalities to proxy microservices into different
 * {@link IServerChannel} which can be registered into {@link IServerBase}.
 * 
 * You may also to unproxy channel to microservice (notice that the returned
 * object is not the actual microservice, it is a {@link Proxy}).
 */
export namespace ProxyChannel {

    export function wrapService(service: unknown): IServerChannel {
        const object = service as Record<string, unknown>;
        const eventRegisters = new Map<string, Register<unknown>>();

        for (const propName in object) {
            if (__guessIfEventRegister(propName)) {
                eventRegisters.set(propName, object[propName]! as Register<unknown>);
            }
        }

        return <IServerChannel>{
            callCommand: <T>(_serverOrClientID: string, command: string, args?: any[]): Promise<T> => {
                const value = object[command];
                if (typeof value !== 'function') {
                    throw new Error(`Command not found: ${command}`);
                }
                return value.apply(object, args);
            },

            registerListener: <T>(_serverOrClientID: string, event: string, _arg?: any): Register<T> => {
                const register = eventRegisters.get(event);
                if (!register) {
                    throw new Error(`Event not found: ${event}`);
                }
                return register as Register<T>;
            },
        };
    }

    export function unwrapChannel<T extends object>(channel: IChannel, opt?: UnwrapChannelOpt): T {
        return <T>(new Proxy(
            {}, {
            get: (_target: T, propName: string | symbol): unknown => {
                if (typeof propName !== 'string') {
                    throw new Error(`Property not found: ${String(propName)}`);
                }

                const propValue = opt?.propValues?.get(propName);
                if (propValue) {
                    return propValue;
                }

                if (__guessIfEventRegister(propName)) {
                    return channel.registerListener(propName);
                }

                return async (...args: any[]): Promise<unknown> => {
                    return channel.callCommand(propName, args);
                };
            }
        }));
    }

    function __guessIfEventRegister(proName: string): boolean {
        return (proName[0] === 'o' 
            && proName[1] === 'n' 
            && CharCode.A <= proName.charCodeAt(2) 
            && proName.charCodeAt(2) <= CharCode.Z
        );
    }
    
    export interface UnwrapChannelOpt {

        /**
		 * If provided, the function will not proxy any of the properties that
         * are in the given {@link Map}, instead, the mapping value will be 
         * directly returned.
		 */
		propValues?: Map<string, unknown>;
    }
}