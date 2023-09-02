import { Register } from "src/base/common/event";
import { CharCode } from "src/base/common/utilities/char";
import { Dictionary } from "src/base/common/utilities/type";
import { IChannel, IServerChannel } from "src/platform/ipc/common/channel";
import { IReviverRegistrant } from "src/platform/ipc/common/revive";
import type { ServerBase } from "src/platform/ipc/common/net";
import { IService } from "src/platform/instantiation/common/decorator";

/**
 * A namespace that provide functionalities to proxy microservices into different
 * {@link IServerChannel} which can be registered into {@link ServerBase}.
 * 
 * You may also to unproxy channel to microservice (notice that the returned
 * object is not the actual microservice, it is a {@link Proxy}).
 */
export namespace ProxyChannel {

    /**
     * @description Wraps a service into an {@link IServerChannel}. This 
     * function transforms a provided service into an {@link IServerChannel} by 
     * extracting its commands and listeners.
     *
     * @param service - The service to be wrapped.
     * @param opts - Optional parameters to configure the wrapping behavior.
     * @returns A {@link IServerChannel} that represents the wrapped service.
     * 
     * @throws {Error} If a command is not found during invocation.
     * @throws {Error} If an event is not found during listener registration.
     */
    export function wrapService(service: unknown, opts?: IWrapServiceOpt): IServerChannel {
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
                    throw new Error(`Command not found: ${command}`);
                }

                if (opts?.revivers?.enableRevivier && Array.isArray(args)) {
                    for (let i = 0; i < args.length; i++) {
                        args[i] = opts.revivers.reviverRegistrant.revive(args[i]);
                    }
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
     * @template T - The type of the service being unwrapped.
     * @param channel - The channel to be unwrapped.
     * @param opt - Optional parameters to configure the unwrapping behavior and revival logic.
     * @returns A {@link Proxy} that represents the unwrapped microservice.
     * 
     * @throws {Error} If a property is not found during access.
     */
    export function unwrapChannel<T extends IService>(channel: IChannel, opt?: IUnwrapChannelOpt): T {
        return (new Proxy<T>(
            <T>{}, {
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

                    let methodsArgs = args;
                    if (typeof opt?.context !== 'undefined') {
                        methodsArgs = [...args, opt.context];
                    }

                    let result: any = await channel.callCommand(propName, methodsArgs);

                    if (opt?.revivers?.enableRevivier) {
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
         * In our case, it will be window ID.
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
        readonly enableRevivier: boolean;
        readonly reviverRegistrant?: IReviverRegistrant;
    }

    interface IEnableReviverOptions extends IReviverOptions {
        readonly enableRevivier: true;
        readonly reviverRegistrant: IReviverRegistrant;
    }
    
    interface IDisableReviverOptions extends IReviverOptions {
        readonly enableRevivier: false;
        readonly reviverRegistrant?: undefined;
    }
}