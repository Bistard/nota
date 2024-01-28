import * as assert from 'assert';
import { Time, TimeUnit } from "src/base/common/date";

suite.only('Time-test', function () {
    
    test('Converts seconds to milliseconds correctly', function () {
        const time = new Time(TimeUnit.Seconds, 1);
        const converted = time.toMs();
        assert.strictEqual(converted.time, 1000);
        assert.strictEqual(converted.unit, TimeUnit.Milliseconds);
    });

    test('Converts minutes to seconds correctly', function () {
        const time = new Time(TimeUnit.Minutes, 1);
        const converted = time.toSec();
        assert.strictEqual(converted.time, 60);
        assert.strictEqual(converted.unit, TimeUnit.Seconds);
    });

    test('Adds times correctly', function () {
        const time1 = new Time(TimeUnit.Seconds, 30);
        const time2 = new Time(TimeUnit.Minutes, 1);
        const result = time1.add(time2);
        assert.strictEqual(result.toSec().time, 90);
    });

    test('Subtracts times correctly', function () {
        const time1 = new Time(TimeUnit.Seconds, 60);
        const time2 = new Time(TimeUnit.Seconds, 30);
        const result = time1.subtract(time2);
        assert.strictEqual(result.toSec().time, 30);
        assert.strictEqual(result.toSec().unit, TimeUnit.Seconds);
    });

    test('Compares two Time objects for equality', function () {
        const time1 = new Time(TimeUnit.Minutes, 1);
        const time2 = new Time(TimeUnit.Seconds, 60);
        assert.ok(time1.equals(time2));
    });
});