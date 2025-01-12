import * as assert from 'assert';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { ServiceDescriptor } from 'src/platform/instantiation/common/descriptor';
import { InstantiationService } from 'src/platform/instantiation/common/instantiation';
import { ServiceCollection } from 'src/platform/instantiation/common/serviceCollection';

const IService1 = createService<IService1>('service1');

interface IService1 extends IService {
	c: number;
}

class Service1 implements IService1 {
	declare _serviceMarker: undefined;
	c = 1;
}

const IService2 = createService<IService2>('service2');

interface IService2 extends IService {
	d: boolean;
}

class Service2 implements IService2 {
	declare _serviceMarker: undefined;
	d = true;
}

const IService3 = createService<IService3>('service3');

interface IService3 extends IService {
	s: string;
}

class Service3 implements IService3 {
	declare _serviceMarker: undefined;
	s = 'farboo';
}

const IDependentService = createService<IDependentService>('dependentService');

interface IDependentService extends IService {
	name: string;
}

class DependentService implements IDependentService {
	declare _serviceMarker: undefined;
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

const IDependentServiceTarget3 = createService<IDependentServiceTarget3>('dependent-service-target-3');

interface IDependentServiceTarget3 extends IService {
	base: boolean;
}

// workbench
class DependentServiceTarget3 extends DependentBaseService implements IDependentServiceTarget3 {
	declare _serviceMarker: undefined;
	constructor(@IDependentService d: IDependentService, @IService1 s: IService1) {
		super(d, s, true);
		assert.ok(d);
		assert.strictEqual(d.name, 'farboo');
		assert.ok(s);
		assert.strictEqual(s.c, 1);
		assert.strictEqual(this.base, true);
	}
}

const IDependentServiceTarget4 = createService<IDependentServiceTarget4>('dependent-service-target-4');

interface IDependentServiceTarget4 extends IService { }

// shortcutService
class DependentServiceTarget4 implements IDependentServiceTarget4 {
	declare _serviceMarker: undefined;
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
		const collection = new ServiceCollection();
		let result = collection.set(IService1, null!);
		assert.strictEqual(result, undefined);
		result = collection.set(IService1, new Service1());
		assert.strictEqual(result, null);
	});

	test('service collection, add/has', () => {
		const collection = new ServiceCollection();
		collection.set(IService1, null!);
		assert.ok(collection.has(IService1));

		collection.set(IService2, null!);
		assert.ok(collection.has(IService1));
		assert.ok(collection.has(IService2));
	});

	test('@Param - simple classes', () => {
		const collection = new ServiceCollection();
		const service = new InstantiationService(collection);
		service.store(IService1, new Service1());
		service.store(IService2, new Service2());
		service.store(IService3, new Service3());

		service.createInstance(Service1Consumer);
	});

	test('@Param - fixed args', () => {
		const collection = new ServiceCollection();
		const service = new InstantiationService(collection);
		service.store(IService1, new Service1());
		service.store(IService2, new Service2());
		service.store(IService3, new Service3());

		service.createInstance(TargetWithStaticParam, true);
	});

	test('@Param - two dependencies', () => {
		const collection = new ServiceCollection();
		const service = new InstantiationService(collection);
		service.store(IService1, new Service1());
		service.store(IService2, new Service2());

		service.createInstance(Target2Dep);
	});

	test('@Param - service descriptor', () => {
		const collection = new ServiceCollection();
		const service = new InstantiationService(collection);
		service.store(IService1, new Service1());
		service.store(IDependentService, new ServiceDescriptor(DependentService, []));

		service.createInstance(DependentServiceTarget);
		service.createInstance(DependentServiceTarget2);
	});

	test('instantiation inheritence', () => {
		const collection = new ServiceCollection();
		const service = new InstantiationService(collection);
		service.store(IService1, new Service1());
		service.store(IDependentService, new ServiceDescriptor(DependentService, []));

		service.createInstance(DependentServiceTarget3);
	});

	test('@Param - inheritence dependency descriptor', () => {
		const collection = new ServiceCollection();
		const service = new InstantiationService(collection);
		service.store(IService1, new Service1());
		service.store(IDependentService, new ServiceDescriptor(DependentService, []));
		service.store(IDependentServiceTarget3, new ServiceDescriptor(DependentServiceTarget3, []));

		service.createInstance(DependentServiceTarget4);
	});

	test('@Param - inheritence dependency instance', () => {
		const collection = new ServiceCollection();
		const service = new InstantiationService(collection);
		service.store(IService1, new Service1());
		service.store(IDependentService, new ServiceDescriptor(DependentService, []));

		const dependentServiceTarget3 = service.createInstance(DependentServiceTarget3);
		service.store(IDependentServiceTarget3, dependentServiceTarget3);

		service.createInstance(DependentServiceTarget4);
	});

	test('@Param - recursive inheritence dependency', () => {
		const collection = new ServiceCollection();
		const service = new InstantiationService(collection);
		service.store(IService1, new Service1());
		service.store(IDependentService, new ServiceDescriptor(DependentService, []));
		service.store(IDependentServiceTarget3, new ServiceDescriptor(DependentServiceTarget3, []));
		service.store(IDependentServiceTarget4, new ServiceDescriptor(DependentServiceTarget4, []));

		service.createInstance(DependentServiceTarget5);
	});

	interface ICreateOnlyOnceClass extends IService { }

	class CreateOnlyOnceClass implements ICreateOnlyOnceClass {

		declare _serviceMarker: undefined;
		public static cnt = 0;

		constructor() {
			CreateOnlyOnceClass.cnt++;
		}

	}

	const ICreateOnlyOnceClass = createService<ICreateOnlyOnceClass>('create-only-once');

	test('createInstance double creation', () => {
		CreateOnlyOnceClass.cnt = 0;

		const collection = new ServiceCollection();
		const service = new InstantiationService(collection);
		service.store(ICreateOnlyOnceClass, new ServiceDescriptor(CreateOnlyOnceClass, []));
		service.createInstance(CreateOnlyOnceClass);
		assert.strictEqual(1, CreateOnlyOnceClass.cnt);
		service.createInstance(CreateOnlyOnceClass);
		assert.strictEqual(2, CreateOnlyOnceClass.cnt);
	});

	test('getOrCreateService, prevent double creation', () => {
		CreateOnlyOnceClass.cnt = 0;

		const collection = new ServiceCollection();
		const service = new InstantiationService(collection);
		service.store(ICreateOnlyOnceClass, new ServiceDescriptor(CreateOnlyOnceClass, []));

		service.getOrCreateService(ICreateOnlyOnceClass);
		assert.strictEqual(1, CreateOnlyOnceClass.cnt);

		service.getOrCreateService(ICreateOnlyOnceClass);
		assert.strictEqual(1, CreateOnlyOnceClass.cnt);
	});

	test('getOrCreateService1, prevent double creation', () => {
		CreateOnlyOnceClass.cnt = 0;

		const collection = new ServiceCollection();
		const service = new InstantiationService(collection);
		service.store(ICreateOnlyOnceClass, new ServiceDescriptor(CreateOnlyOnceClass, []));

		service.getOrCreateService1((provider) => {
			return provider.getOrCreateService(ICreateOnlyOnceClass);
		});
		assert.strictEqual(1, CreateOnlyOnceClass.cnt);

		service.getOrCreateService1((provider) => {
			return provider.getOrCreateService(ICreateOnlyOnceClass);
		});
		assert.strictEqual(1, CreateOnlyOnceClass.cnt);
	});

	test('instantiation from parent', () => {
		const parent = new InstantiationService(new ServiceCollection());
		const child = new InstantiationService(new ServiceCollection(), parent);

		parent.store(IService1, new ServiceDescriptor(Service1, []));

		const childService = child.createInstance(DependentService) as DependentService;
		assert.strictEqual(childService.name, 'farboo');
	});

	test('child get service from parent', () => {
		const parent = new InstantiationService(new ServiceCollection());
		const child = new InstantiationService(new ServiceCollection(), parent);

		const parentService = new Service1();
		parentService.c = 2;
		parent.store(IService1, parentService);

		let service = child.getService(IService1);
		assert.strictEqual(service.c, 2);

		service = child.getOrCreateService(IService1);
		assert.strictEqual(service.c, 2);
	});
});
