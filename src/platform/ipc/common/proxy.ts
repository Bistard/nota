import type { IService } from "src/platform/instantiation/common/decorator";
import type { ServerBase } from "src/platform/ipc/common/net";
import type { IChannel, IServerChannel } from "src/platform/ipc/common/channel";
import type { AsyncOnly, Dictionary } from "src/base/common/utilities/type";
import type { Register } from "src/base/common/event";
import type { IReviverRegistrant } from "src/platform/ipc/common/revive";
import { CharCode } from "src/base/common/utilities/char";
import { panic } from "src/base/common/utilities/panic";

/**
 * A namespace that provide functionalities to proxy microservices into different
 * {@link IServerChannel} which can be registered into {@link ServerBase}.
 * 
 * You may also to un-proxy channel to microservice (notice that the returned
 * object is not the actual microservice, it is a {@link Proxy}).
 */
export namespace ProxyChannel {

    /**
     * @description Wraps a service into an {@link IServerChannel}. This 
     * function transforms a provided service into an {@link IServerChannel} by 
     * extracting its commands and listeners.
     *
     * @param service The service to be wrapped.
     * @param opts Optional parameters to configure the wrapping behavior.
     * @returns A {@link IServerChannel} that represents the wrapped service.
     * 
     * @throws If a command is not found during invocation.
     * @throws If an event is not found during listener registration.
     */
    export function wrapService<T extends AsyncOnly<IService>>(service: T, opts?: IWrapServiceOpt): IServerChannel {
        const object = <Dictionary<string, unknown>>service;
        const eventRegisters = new Map<string, Register<unknown>>();
        
        for (const propName in object) {
            if (__guessIfEventRegister(propName)) {
                eventRegisters.set(propName, object[propName] as Register<unknown>);
            }
        }

        return <IServerChannel>{
            callCommand: <T>(_serverOrClientID: string, command: string, args?: any[]): Promise<T> => {
                const value = object[command];
                if (typeof value !== 'function') {
                    panic(`Command not found: ${command}`);
                }

                if (opts?.revivers?.enableReviver && Array.isArray(args)) {
                    for (let i = 0; i < args.length; i++) {
                        args[i] = opts.revivers.reviverRegistrant.revive(args[i]);
                    }
                }

                return value.apply(object, args);
            },

            registerListener: <T>(_serverOrClientID: string, event: string, _arg?: any): Register<T> => {
                const register = eventRegisters.get(event);
                if (!register) {
                    panic(`Event not found: ${event}`);
                }
                return register as Register<T>;
            },
        };
    }

    /**
     * @description Unwraps an {@link IServerChannel} into a Proxy of the given 
     * type T.
     * 
     * This function creates a {@link Proxy} object that represents the 
     * underlying microservice exposed by the channel. Commands and listeners of 
     * the channel are accessible as methods and properties on the {@link Proxy}. 
     * Additionally, argument and result revival can be configured using the 
     * provided options.
     *
     * @template T The type of the service being unwrapped.
     * @param channel The channel to be unwrapped.
     * @param opt Optional parameters to configure the unwrapping behavior and revival logic.
     * @returns A {@link Proxy} that represents the unwrapped microservice.
     * 
     * @throws If a property is not found during access.
     */
    export function unwrapChannel<T extends AsyncOnly<IService>>(channel: IChannel, opt?: IUnwrapChannelOpt): T {
        return (new Proxy<T>(
            <T>{}, {
            get: (_target: T, propName: string | symbol): unknown => {
                if (typeof propName !== 'string') {
                    panic(`Property not found: ${String(propName)}`);
                }

                const propValue = opt?.propValues?.get(propName);
                if (propValue) {
                    return propValue;
                }

                if (__guessIfEventRegister(propName)) {
                    return channel.registerListener(propName);
                }

                return async (...args: any[]): Promise<unknown> => {

                    let methodsArgs = args;
                    if (typeof opt?.context !== 'undefined') {
                        methodsArgs = [...args, opt.context];
                    }

                    let result: any = await channel.callCommand(propName, methodsArgs);

                    if (opt?.revivers?.enableReviver) {
                        result = opt.revivers.reviverRegistrant.revive(result);
                    }

                    return result;
                };
            }
        }));
    }

    const __guessIfEventRegister = function (proName: string): boolean {
        return (
            proName[0] === 'o'
            && proName[1] === 'n'
            && CharCode.A <= proName.charCodeAt(2)
            && proName.charCodeAt(2) <= CharCode.Z
        );
    };

    export interface IWrapServiceOpt {
        readonly revivers?: IEnableReviverOptions | IDisableReviverOptions;
    }

    export interface IUnwrapChannelOpt {

        /**
         * Context is any data that will always be passed as the last argument
         * whenever a function is invoked from the result of {@link ProxyChannel.unwrapChannel}.
         */
        readonly context?: any;

        /**
         * If provided, the function will not proxy any of the properties that
         * are in the given {@link Map}, instead, the mapping value will be 
         * directly returned.
         */
        readonly propValues?: Map<string, unknown>;

        readonly revivers?: IEnableReviverOptions | IDisableReviverOptions;
    }

    interface IReviverOptions {
        /**
         * @see `revive.ts`.
         * @default false
         * @note If you ensure the data structure passed between IPC will not be
         * accessed about their prototype then you may disable this manually so
         * that it may increases the performance to some extent.
         */
        readonly enableReviver: boolean;
        readonly reviverRegistrant?: IReviverRegistrant;
    }

    interface IEnableReviverOptions extends IReviverOptions {
        readonly enableReviver: true;
        readonly reviverRegistrant: IReviverRegistrant;
    }
    
    interface IDisableReviverOptions extends IReviverOptions {
        readonly enableReviver: false;
    }
}