import * as assert from 'assert';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';
import { ServiceDescriptor } from 'src/code/common/service/instantiationService/descriptor';
import { InstantiationService } from 'src/code/common/service/instantiationService/instantiation';
import { ServiceCollection } from 'src/code/common/service/instantiationService/serviceCollection';

const IService1 = createDecorator<IService1>('service1');

interface IService1 {
	c: number;
}

class Service1 implements IService1 {
	c = 1;
}

const IService2 = createDecorator<IService2>('service2');

interface IService2 {
	d: boolean;
}

class Service2 implements IService2 {
	d = true;
}

const IService3 = createDecorator<IService3>('service3');

interface IService3 {
	s: string;
}

class Service3 implements IService3 {
	s = 'farboo';
}

const IDependentService = createDecorator<IDependentService>('dependentService');

interface IDependentService {
	name: string;
}

class DependentService implements IDependentService {
	constructor(@IService1 service: IService1) {
		assert.strictEqual(service.c, 1);
	}
	name = 'farboo';
}

class Service1Consumer {

	constructor(@IService1 service1: IService1) {
		assert.ok(service1);
		assert.strictEqual(service1.c, 1);
	}
}

class Target2Dep {

	constructor(@IService1 service1: IService1, @IService2 service2: Service2) {
		assert.ok(service1 instanceof Service1);
		assert.ok(service2 instanceof Service2);
	}
}

class TargetWithStaticParam {
	constructor(v: boolean, @IService1 service1: IService1) {
		assert.ok(v);
		assert.ok(service1);
		assert.strictEqual(service1.c, 1);
	}
}

class DependentServiceTarget {
	constructor(@IDependentService d: IDependentService) {
		assert.ok(d);
		assert.strictEqual(d.name, 'farboo');
	}
}

class DependentServiceTarget2 {
	constructor(@IDependentService d: IDependentService, @IService1 s: IService1) {
		assert.ok(d);
		assert.strictEqual(d.name, 'farboo');
		assert.ok(s);
		assert.strictEqual(s.c, 1);
	}
}

suite('instantiationService-test', () => {

    test('service collection, cannot overwrite', () => {
		let collection = new ServiceCollection();
		let result = collection.set(IService1, null!);
		assert.strictEqual(result, undefined);
		result = collection.set(IService1, new Service1());
		assert.strictEqual(result, null);
	});

	test('service collection, add/has', () => {
		let collection = new ServiceCollection();
		collection.set(IService1, null!);
		assert.ok(collection.has(IService1));

		collection.set(IService2, null!);
		assert.ok(collection.has(IService1));
		assert.ok(collection.has(IService2));
	});

	test('@Param - simple clase', () => {
		let collection = new ServiceCollection();
		let service = new InstantiationService(collection);
		service.register(IService1, new Service1());
		service.register(IService2, new Service2());
		service.register(IService3, new Service3());

		service.createInstance(Service1Consumer);
	});

	test('@Param - fixed args', () => {
		let collection = new ServiceCollection();
		let service = new InstantiationService(collection);
		service.register(IService1, new Service1());
		service.register(IService2, new Service2());
		service.register(IService3, new Service3());

		service.createInstance(TargetWithStaticParam, true);
	});

    test('@Param - two dependencies', () => {
        let collection = new ServiceCollection();
		let service = new InstantiationService(collection);
        service.register(IService1, new Service1());
        service.register(IService2, new Service2());
        
        service.createInstance(Target2Dep);
    });

    test('@Param - service descriptor', () => {
        let collection = new ServiceCollection();
		let service = new InstantiationService(collection);
        service.register(IService1, new Service1());
        service.register(IDependentService, new ServiceDescriptor(DependentService));

        service.createInstance(DependentServiceTarget);
        service.createInstance(DependentServiceTarget2);
    });
});
