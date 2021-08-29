// import { ServiceDescriptor } from "src/code/common/service/descriptor";
// import { createDecorator, ServiceIdentifier } from "src/code/common/service/decorator";
// import { InstantiationService } from "src/code/common/service/instantiation";
// import { ServiceCollection } from "src/code/common/service/serviceCollection";

// ////////////////////////////////////////////////////////////////////////////////

// interface IHelloService {
//     sayHello(): void;
// }

// // Create a decorator used to reference the interface type.
// const IHelloService: ServiceIdentifier<IHelloService> = createDecorator<IHelloService>('helloService');

// // Create a service collection where concrete implementation types are registered.
// const serviceCollection = new ServiceCollection();

// class HelloService implements IHelloService { 
//     sayHello() {
//         console.log('Hello!');
//     }
// }

// // Declare that the MyService class is the type that is instantiated when an IHelloService is needed.
// serviceCollection.set(IHelloService, new ServiceDescriptor(HelloService));

// const instantiationService = new InstantiationService(serviceCollection);

// // This is a class that requires an instance of IHelloService when created.
// export class MyDependentClass {
//     private _myService: IHelloService;

//     // The myService parameter is annotated with the IHelloService decorator.
//     constructor(@IHelloService myService: IHelloService) {
//         this._myService = myService;
//     }

//     makeMyServiceSayHello() {
//         console.log(this._myService.sayHello());
//     }
// }

// // Create an instance of myDependentClass.
// const myDependentClass = instantiationService.createInstance(MyDependentClass);
// myDependentClass.makeMyServiceSayHello();