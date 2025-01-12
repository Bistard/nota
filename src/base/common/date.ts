/**
 * @description Returns the current time in a standard format.
 * @example 2022-08-04 03:17:18.657
 */
export function getCurrTimeStamp(): string {
    const currentTime = new Date();
    return `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, '0')}-${currentTime.getDate().toString().padStart(2, '0')} ${(currentTime.getHours()).toString().padStart(2, '0')}:${(currentTime.getMinutes()).toString().padStart(2, '0')}:${(currentTime.getSeconds()).toString().padStart(2, '0')}.${(currentTime.getMilliseconds()).toString().padStart(3, '0')}`;
}

/**
 * @description Returns the current time in a standard format.
 * @example 2022-08-04-03-17-18-657
 */
export function getFormatCurrTimeStamp(): string {
    return getCurrTimeStamp().replace(/:| |\./g, '-');
}

export const enum TimeUnit {
    Milliseconds = 'ms',
    Seconds      = 'sec',
    Minutes      = 'min',
}

/**
 * @description Represents a time value in a specific unit. Can be easily 
 * converted into other unit representation.
 * 
 * @note The purpose of this data structure is mainly to increase readability.
 */
export class Time {

    // [public fields]

    public static readonly INSTANT = new Time(TimeUnit.Milliseconds, 0);

    // [private fields]

    private readonly _unit: TimeUnit;
    private readonly _time: number;

    // [constructor]

    constructor(unit: TimeUnit, time: number) {
        this._unit = unit;
        this._time = time;
    }

    // [getter]

    get unit(): TimeUnit {
        return this._unit;
    }

    get time(): number {
        return this._time;
    }

    // [public static methods]

    public static ms(time: number): Time {
        return new Time(TimeUnit.Milliseconds, time);
    }
    
    public static sec(time: number): Time {
        return new Time(TimeUnit.Seconds, time);
    }
    
    public static min(time: number): Time {
        return new Time(TimeUnit.Minutes, time);
    }

    // [public methods]

    public toString(): string {
        return `${this.time} ${this._unit}`;
    }

    public toMs(): Time {
        const ms = this._unit === TimeUnit.Seconds ? this._time * 1000
                 : this._unit === TimeUnit.Minutes ? this._time * 60000
                 : this._time;
        return new Time(TimeUnit.Milliseconds, ms);
    }

    public toSec(): Time {
        const sec = this._unit === TimeUnit.Milliseconds ? this._time / 1000
                  : this._unit === TimeUnit.Minutes ? this._time * 60
                  : this._time;
        return new Time(TimeUnit.Seconds, sec);
    }
    
    public toMin(): Time {
        const min = this._unit === TimeUnit.Milliseconds ? this._time / 60000
                  : this._unit === TimeUnit.Seconds ? this._time / 60
                  : this._time;
        return new Time(TimeUnit.Minutes, min);
    }

    public to(unit: TimeUnit): Time {
        switch (unit) {
            case TimeUnit.Milliseconds: return this.toMs();
            case TimeUnit.Seconds: return this.toSec();
            case TimeUnit.Minutes: return this.toMin();
        }
    }

    public add(time: Time): Time {
        const totalMs = this.toMs().time + time.toMs().time;
        return new Time(TimeUnit.Milliseconds, totalMs);
    }

    public subtract(time: Time): Time {
        const totalMs = this.toMs().time - time.toMs().time;
        return new Time(TimeUnit.Milliseconds, totalMs);
    }

    public equals(time: Time): boolean {
        return this.toMs().time === time.toMs().time;
    }
}

export const INSTANT_TIME = Time.INSTANT;