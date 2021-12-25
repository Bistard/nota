import * as assert from 'assert';

suite('instantiationService-test', () => {

    // TODO

});

// import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
// import { createDecorator, ServiceIdentifier } from "src/code/common/service/instantiationService/decorator";
// import { InstantiationService } from "src/code/common/service/instantiationService/instantiation";
// import { ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";

// ////////////////////////////////////////////////////////////////////////////////

// interface IHelloService1 {
//     sayHello(): void;
// }

// // Create a decorator used to reference the interface type.
// const IHelloService1: ServiceIdentifier<IHelloService1> = createDecorator<IHelloService1>('helloService1');

// // Create a service collection where concrete implementation types are registered.
// const serviceCollection = new ServiceCollection();

// class HelloService1 implements IHelloService1 { 
//     sayHello() {
//         console.log('Hello#1!');
//     }
// }

// // register an instance
// serviceCollection.set(IHelloService1, new HelloService1());

// const instantiationService = new InstantiationService(serviceCollection);

// // This is a class that requires an instance of IHelloService1 when created.
// export class MyDependentClass {
//     private _myService: IHelloService1;

//     // The myService parameter is annotated with the IHelloService1 decorator.
//     constructor(@IHelloService1 myService: IHelloService1) {
//         this._myService = myService;
//     }

//     makeMyServiceSayHello() {
//         this._myService.sayHello();
//     }
// }

// // Create an instance of myDependentClass.
// console.log('======Test round #1======');
// const myDependentClass = instantiationService.createInstance(MyDependentClass);
// myDependentClass.makeMyServiceSayHello();


// ////////////////////////////////////////////////////////////////////////////////

// interface IHelloService2 {
//     sayHello(): void;
// }

// const IHelloService2: ServiceIdentifier<IHelloService2> = createDecorator<IHelloService2>('helloService2');

// class HelloService2 implements IHelloService2 { 

//     constructor(@IHelloService1 private myService1: IHelloService1) {
   
//     }

//     sayHello() {
//         this.myService1.sayHello();
//         console.log('Hello#2!');
//     }
// }

// //register a ServiceDescriptor
// serviceCollection.set(IHelloService2, new ServiceDescriptor(HelloService2));

// export class MyDependentTreeClass {

//     // The myService parameter is annotated with the IHelloService1 decorator.
//     constructor(@IHelloService2 private myService2: IHelloService2) {

//     }

//     makeMyServiceSayHello() {
//         this.myService2.sayHello();
//     }
// }

// console.log('======Test round #2======');
// const myDependenTreeClass = instantiationService.createInstance(MyDependentTreeClass);
// myDependenTreeClass.makeMyServiceSayHello();