// import { _ServiceUtil } from "src/code/common/service/decorator";
// import { ServiceDescriptor } from "src/code/common/service/descriptor";
// import { ServiceCollection } from "src/code/common/service/serviceCollection";

// export class InstantiationService {

//     private readonly _serviceCollections: ServiceCollection;

//     constructor(serviceCollections: ServiceCollection = new ServiceCollection()) {
//         this._serviceCollections = serviceCollections;
//     }

//     /**
//      * @description TBD
//      */
//     public createInstance(ctorOrDescriptor: any | ServiceDescriptor<any>, ...rest: any[]): any {
//         let res: any;
//         if (ctorOrDescriptor instanceof ServiceDescriptor) {
//             res = this._createInstance(ctorOrDescriptor.ctor, ctorOrDescriptor.arguments.concat(rest));
//         } else {
//             res = this._createInstance(ctorOrDescriptor, rest);
//         }
//         return res;
//     }

//     private _createInstance<T>(ctor: any, args: any[] = []): T {
//         let serviceDependencies = _ServiceUtil.getServiceDependencies(ctor).sort((a, b) => a.index  - b.index);
//         let services: any[] = [];
//         for (const dependency of serviceDependencies) {
//             let service = this._getOrCreateServiceInstance(dependency.id);
//             if (!service && !dependency.optional) {
// 				throw new Error(`[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`);
// 			}
//             services.push(service);
//         }

//         // ...

//         return <T>new ctor(...args);
//     }

//     private _getOrCreateServiceInstance<T>(serviceDescriptor: ServiceDescriptor<T>): T {
//         return <T>null;
//     }

// }