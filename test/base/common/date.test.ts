import * as assert from 'assert';
import { Time, TimeUnit } from "src/base/common/date";

suite('Time-test', function () {
    
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

    suite('Constructor', () => {
        test('should initialize with given unit and time', () => {
            const time = new Time(TimeUnit.Seconds, 10);
            assert.strictEqual(time.unit, TimeUnit.Seconds);
            assert.strictEqual(time.time, 10);
        });
    });

    suite('Static Methods', () => {
        test('ms() should create a Time object with milliseconds', () => {
            const time = Time.ms(500);
            assert.strictEqual(time.unit, TimeUnit.Milliseconds);
            assert.strictEqual(time.time, 500);
        });

        test('sec() should create a Time object with seconds', () => {
            const time = Time.sec(10);
            assert.strictEqual(time.unit, TimeUnit.Seconds);
            assert.strictEqual(time.time, 10);
        });

        test('min() should create a Time object with minutes', () => {
            const time = Time.min(2);
            assert.strictEqual(time.unit, TimeUnit.Minutes);
            assert.strictEqual(time.time, 2);
        });
    });

    suite('toString', () => {
        test('should return formatted string with time and unit', () => {
            const time = new Time(TimeUnit.Seconds, 15);
            assert.strictEqual(time.toString(), '15 sec');
        });
    });

    suite('Conversion Methods', () => {
        test('toMs() should convert to milliseconds', () => {
            const time = new Time(TimeUnit.Seconds, 1).toMs();
            assert.strictEqual(time.unit, TimeUnit.Milliseconds);
            assert.strictEqual(time.time, 1000);
        });

        test('toSec() should convert to seconds', () => {
            const time = new Time(TimeUnit.Milliseconds, 2000).toSec();
            assert.strictEqual(time.unit, TimeUnit.Seconds);
            assert.strictEqual(time.time, 2);
        });

        test('toMin() should convert to minutes', () => {
            const time = new Time(TimeUnit.Seconds, 120).toMin();
            assert.strictEqual(time.unit, TimeUnit.Minutes);
            assert.strictEqual(time.time, 2);
        });

        test('to() should convert to specified unit', () => {
            const time = new Time(TimeUnit.Seconds, 90).to(TimeUnit.Minutes);
            assert.strictEqual(time.unit, TimeUnit.Minutes);
            assert.strictEqual(time.time, 1.5);
        });
    });

    suite('Arithmetic Methods', () => {
        test('add() should add two Time objects', () => {
            const time1 = new Time(TimeUnit.Seconds, 30);
            const time2 = new Time(TimeUnit.Minutes, 1);
            const result = time1.add(time2);
            assert.strictEqual(result.unit, TimeUnit.Milliseconds);
            assert.strictEqual(result.time, 90000);
        });

        test('subtract() should subtract two Time objects', () => {
            const time1 = new Time(TimeUnit.Minutes, 2);
            const time2 = new Time(TimeUnit.Seconds, 30);
            const result = time1.subtract(time2);
            assert.strictEqual(result.unit, TimeUnit.Milliseconds);
            assert.strictEqual(result.time, 90000);
        });
    });

    suite('Comparison Methods', () => {
        test('equals() should return true for equal times', () => {
            const time1 = new Time(TimeUnit.Milliseconds, 60000);
            const time2 = new Time(TimeUnit.Minutes, 1);
            assert.strictEqual(time1.equals(time2), true);
        });

        test('equals() should return false for unequal times', () => {
            const time1 = new Time(TimeUnit.Seconds, 45);
            const time2 = new Time(TimeUnit.Seconds, 30);
            assert.strictEqual(time1.equals(time2), false);
        });
    });

    suite('Static Property', () => {
        test('INSTANT should be a Time object representing 0 ms', () => {
            assert.strictEqual(Time.INSTANT.unit, TimeUnit.Milliseconds);
            assert.strictEqual(Time.INSTANT.time, 0);
        });
    });
});