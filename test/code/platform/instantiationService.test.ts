import * as assert from 'assert';
import { createDecorator } from 'src/code/platform/instantiation/common/decorator';
import { ServiceDescriptor } from 'src/code/platform/instantiation/common/descriptor';
import { InstantiationService } from 'src/code/platform/instantiation/common/instantiation';
import { ServiceCollection } from 'src/code/platform/instantiation/common/serviceCollection';

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

abstract class DependentVeryBaseService {
	public base: boolean;
	constructor(base: boolean) {
		this.base = base;
	}
}

abstract class DependentBaseService extends DependentVeryBaseService {
	constructor(d: IDependentService, s: IService1, base: boolean) {
		super(base);
		assert.ok(d);
		assert.strictEqual(d.name, 'farboo');
		assert.ok(s);
		assert.strictEqual(s.c, 1);
	}
}

const IDependentServiceTarget3 = createDecorator<IDependentServiceTarget3>('dependent-service-target-3');

interface IDependentServiceTarget3 {
	base: boolean;
}

// workbench
class DependentServiceTarget3 extends DependentBaseService implements IDependentServiceTarget3 {
	constructor(@IDependentService d: IDependentService, @IService1 s: IService1) {
		super(d, s, true);
		assert.ok(d);
		assert.strictEqual(d.name, 'farboo');
		assert.ok(s);
		assert.strictEqual(s.c, 1);
		assert.strictEqual(this.base, true);
	}
}

const IDependentServiceTarget4 = createDecorator<IDependentServiceTarget4>('dependent-service-target-4');

interface IDependentServiceTarget4 {

}

// shortcutService
class DependentServiceTarget4 implements IDependentServiceTarget4 {
	constructor(@IDependentServiceTarget3 d: IDependentServiceTarget3) {
		assert.ok(d);
		assert.strictEqual(d.base, true);
	}
}

// other places
class DependentServiceTarget5 {
	constructor(@IDependentServiceTarget4 d: IDependentServiceTarget4) {
		assert.ok(d);
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

	test('@Param - simple classes', () => {
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

	test('instantiation inheritence', () => {
		let collection = new ServiceCollection();
		let service = new InstantiationService(collection);
		service.register(IService1, new Service1());
		service.register(IDependentService, new ServiceDescriptor(DependentService));

		service.createInstance(DependentServiceTarget3);
	});

	test('@Param - inheritence dependency descriptor', () => {
		let collection = new ServiceCollection();
		let service = new InstantiationService(collection);
		service.register(IService1, new Service1());
		service.register(IDependentService, new ServiceDescriptor(DependentService));
		service.register(IDependentServiceTarget3, new ServiceDescriptor(DependentServiceTarget3));

		service.createInstance(DependentServiceTarget4);
	});

	test('@Param - inheritence dependency instance', () => {
		let collection = new ServiceCollection();
		let service = new InstantiationService(collection);
		service.register(IService1, new Service1());
		service.register(IDependentService, new ServiceDescriptor(DependentService));
		
		const dependentServiceTarget3 = service.createInstance(DependentServiceTarget3);
		service.register(IDependentServiceTarget3, dependentServiceTarget3);

		service.createInstance(DependentServiceTarget4);
	});

	test('@Param - recursive inheritence dependency', () => {
		let collection = new ServiceCollection();
		let service = new InstantiationService(collection);
		service.register(IService1, new Service1());
		service.register(IDependentService, new ServiceDescriptor(DependentService));
		service.register(IDependentServiceTarget3, new ServiceDescriptor(DependentServiceTarget3));
		service.register(IDependentServiceTarget4, new ServiceDescriptor(DependentServiceTarget4));
		
		service.createInstance(DependentServiceTarget5);
	});

	interface ICreateOnlyOnceClass {}

	class CreateOnlyOnceClass implements ICreateOnlyOnceClass {
		
		public static cnt = 0;
		
		constructor() {
			CreateOnlyOnceClass.cnt++;
		}

	}

	const ICreateOnlyOnceClass = createDecorator<ICreateOnlyOnceClass>('create-only-once');

	test('createInstance double creation', () => {
		CreateOnlyOnceClass.cnt = 0;

		let collection = new ServiceCollection();
		let service = new InstantiationService(collection);
		service.register(ICreateOnlyOnceClass, new ServiceDescriptor(CreateOnlyOnceClass));
		service.createInstance(CreateOnlyOnceClass);
		assert.strictEqual(1, CreateOnlyOnceClass.cnt);
		service.createInstance(CreateOnlyOnceClass);
		assert.strictEqual(2, CreateOnlyOnceClass.cnt);
	});

	test('getOrCreateService, prevent double creation', () => {
		CreateOnlyOnceClass.cnt = 0;
		
		let collection = new ServiceCollection();
		let service = new InstantiationService(collection);
		service.register(ICreateOnlyOnceClass, new ServiceDescriptor(CreateOnlyOnceClass));
		
		service.getOrCreateService(ICreateOnlyOnceClass);
		assert.strictEqual(1, CreateOnlyOnceClass.cnt);
		
		service.getOrCreateService(ICreateOnlyOnceClass);
		assert.strictEqual(1, CreateOnlyOnceClass.cnt);
	});

	test('getOrCreateService1, prevent double creation', () => {
		CreateOnlyOnceClass.cnt = 0;
		
		let collection = new ServiceCollection();
		let service = new InstantiationService(collection);
		service.register(ICreateOnlyOnceClass, new ServiceDescriptor(CreateOnlyOnceClass));
		
		service.getOrCreateService1((provider) => {
			provider.getOrCreateService(ICreateOnlyOnceClass);
		});
		assert.strictEqual(1, CreateOnlyOnceClass.cnt);
		
		service.getOrCreateService1((provider) => {
			provider.getOrCreateService(ICreateOnlyOnceClass);
		});
		assert.strictEqual(1, CreateOnlyOnceClass.cnt);
	});

	test('instantiation from parent', () => {
		const parent = new InstantiationService(new ServiceCollection());
		const child = new InstantiationService(new ServiceCollection(), parent);

		parent.register(IService1, new ServiceDescriptor(Service1));
		
		const childService = child.createInstance(DependentService) as DependentService;
		assert.strictEqual(childService.name, 'farboo');
	});

	test('child get service from parent', () => {
		const parent = new InstantiationService(new ServiceCollection());
		const child = new InstantiationService(new ServiceCollection(), parent);

		const parentService = new Service1();
		parentService.c = 2;
		parent.register(IService1, parentService);
		
		let service = child.getService(IService1);
		assert.strictEqual(service.c, 2);

		service = child.getOrCreateService(IService1);
		assert.strictEqual(service.c, 2);
	});
});
