import * as assert from 'assert';
import { Ok, Err, err, GetOkType, GetErrType, Result, AsyncResult, GetAsyncOkType, GetAsyncErrType, ok } from "src/base/common/result";
import { panic } from "src/base/common/utilities/panic";
import { checkTrue, AreEqual, isString } from "src/base/common/utilities/type";

suite('result-test', () => {

    suite('Ok', () => {
        const okInstance: Result<number, string> = new Ok(42);

        test('isOk method should return true', () => {
            assert.ok(okInstance.isOk());
        });

        test('isErr method should return false', () => {
            assert.ok(!okInstance.isErr());
        });

        test('unwrap should return inner data', () => {
            assert.strictEqual(okInstance.unwrap(), 42);
        });

        test('unwrapOr should return inner data regardless of provided data', () => {
            assert.strictEqual(okInstance.unwrapOr(0), 42);
        });

        test('unwrapErr should panics', () => {
            assert.throws(() => okInstance.unwrapErr());
        });

        test('expect should return inner data regardless of error message', () => {
            assert.strictEqual(okInstance.expect('This should not be thrown'), 42);
        });

        test('match should apply onOk function and return its result', () => {
            assert.strictEqual(okInstance.match(data => data + 1, _ => 0), 43);
        });

        test('map should apply a function to inner data and return a new Ok instance', () => {
            const mappedResult = okInstance.map(data => data * 2);
            assert.ok(mappedResult.isOk());
            assert.strictEqual(mappedResult.unwrap(), 84);
        });

        test('mapErr should not modify Ok instance and return the same Ok', () => {
            const mappedResult = okInstance.mapErr(err => `Modified: ${err}`);
            assert.ok(mappedResult.isOk());
            assert.strictEqual(mappedResult.unwrap(), 42);
        });

        test('andThen should apply a function and return a new Result for Ok', () => {
            const result = okInstance.andThen(data => new Ok(data.toString()));
            assert.ok(result.isOk());
            assert.strictEqual(result.unwrap(), '42');
        });

        test('orElse should return the same Ok instance for Ok', () => {
            const result = okInstance.orElse(err => new Ok(0));
            assert.ok(result.isOk());
            assert.strictEqual(result.unwrap(), 42);
        });
    });

    suite('Err', () => {
        const errInstance: Result<number, string> = new Err("Error Message");

        test('isOk method should return false', () => {
            assert.ok(!errInstance.isOk());
        });

        test('isErr method should return true', () => {
            assert.ok(errInstance.isErr());
        });

        test('unwrap should throw an error', () => {
            assert.throws(() => {
                errInstance.unwrap();
            });
        });

        test('unwrapOr should return provided default value', () => {
            assert.strictEqual(errInstance.unwrapOr(0), 0);
        });

        test('unwrapErr should return inner value', () => {
            assert.strictEqual(errInstance.unwrapErr(), "Error Message");
        });

        test('expect should throw provided error message', () => {
            assert.throws(() => {
                errInstance.expect('Custom Error Message');
            });
        });

        test('match should apply onError function and return its result', () => {
            assert.strictEqual(errInstance.match(num => 'onSuccess', err => 'onError'), 'onError');
        });

        test('map should not modify Err instance and return the same Err', () => {
            const mappedResult = errInstance.map(data => data * 2);
            assert.ok(mappedResult.isErr());
            assert.throws(() => mappedResult.unwrap());
        });

        test('mapErr should apply a function to error and return a new Err instance', () => {
            const mappedResult = errInstance.mapErr(err => `Modified: ${err}`);
            assert.ok(mappedResult.isErr());
            assert.strictEqual(mappedResult.error, 'Modified: Error Message');
        });
    
        test('andThen should not modify Err instance and return the same Err', () => {
            const chainedResult = errInstance.andThen(_ => new Ok('new value'));
            assert.ok(chainedResult.isErr());
            assert.throws(() => chainedResult.unwrap());
        });
    
        test('orElse should apply a function to error and return a new Result', () => {
            const elseResult = errInstance.orElse(err => new Ok(42));
            assert.ok(elseResult.isOk());
            assert.strictEqual(elseResult.unwrap(), 42);
        });
    });

    suite('Result', () => {

        function getResult(value: boolean): Result<string, Error> {
            if (value) {
                return ok('ok');
            }
            return err(new Error('err'));
        }

        test('GetOkType & GetErrType', () => {
            const result = getResult(true);
            checkTrue<AreEqual<GetOkType<typeof result>, string>>();
            checkTrue<AreEqual<GetErrType<typeof result>, Error>>();
        });
        
        test('isOk type-check', () => {
            const result = getResult(true);
            
            if (result.isOk()) {
                checkTrue<AreEqual<typeof result.data, string>>();
            } else {
                checkTrue<AreEqual<typeof result.error, Error>>();
            }
        });

        test('isErr type-check', () => {
            const result = getResult(true);
            if (result.isErr()) {
                checkTrue<AreEqual<typeof result.error, Error>>();
            } else {
                checkTrue<AreEqual<typeof result.data, string>>();
            }
        });
        
        test('unwrap type-check', () => {
            const result = getResult(true);
            const str = result.unwrap();
            checkTrue<AreEqual<typeof str, string>>();
        });
        
        test('unwrapOr type-check', () => {
            const result = getResult(true);
            const str = result.unwrapOr('default');
            checkTrue<AreEqual<typeof str, string>>();
        });
        
        test('expect type-check', () => {
            const result = getResult(true);
            const str = result.expect('expect error message');
            checkTrue<AreEqual<typeof str, string>>();
        });
        
        test('match type-check', () => {
            const result = getResult(true);
            result.match(
                (data) => {
                    assert.ok(isString(data));
                    checkTrue<AreEqual<typeof data, string>>();
                }, 
                (err) => {
                    assert.ok(err instanceof Error);
                    checkTrue<AreEqual<typeof err, Error>>();
                },
            );
        });

        test('mapErr type-check', () => {
            const result = getResult(false);
            const mappedResult = result.mapErr(err => new Error(err.message));
    
            if (mappedResult.isOk()) {
                checkTrue<AreEqual<typeof mappedResult.data, string>>();
            } else {
                checkTrue<AreEqual<typeof mappedResult.error, Error>>();
            }
        });
    
        test('andThen type-check', () => {
            const result = getResult(true);
            const chainedResult = result.andThen(data => ok<number, Error>(data.length));
    
            if (chainedResult.isOk()) {
                checkTrue<AreEqual<typeof chainedResult.data, number>>();
            } else {
                checkTrue<AreEqual<typeof chainedResult.error, Error>>();
            }
        });
    
        test('orElse type-check', () => {
            const result = getResult(false);
            const elseResult = result.orElse(_ => ok<string, Error>('Recovered'));
    
            if (elseResult.isOk()) {
                checkTrue<AreEqual<typeof elseResult.data, string>>();
            } else {
                checkTrue<AreEqual<typeof elseResult.error, Error>>();
            }
        });

        test('Chained andThen with Ok results', () => {
            const result = ok(2)
                .andThen((data) => ok(data * 2))
                .andThen((data) => ok(data + 3))
                .andThen((data) => ok(data.toString()));
    
            assert.strictEqual(result.isOk(), true);
            assert.strictEqual(result.unwrap(), '7');
        });
    
        test('Chained andThen stops on Err', () => {
            const result = ok(2)
                .andThen((data) => ok(data * 2))
                .andThen(() => err<string, string>('Error occurred'))
                .andThen((data) => ok(data + 3));
    
            assert.strictEqual(result.isErr(), true);
            assert.strictEqual(result.unwrapErr(), 'Error occurred');
        });
    
        test('Chained orElse recovers from Err', () => {
            const result = err<number, string>('Initial error')
                .orElse((error) => ok(error.length))
                .andThen((data) => ok(data * 2))
                .andThen((data) => ok(data + 1));
    
            assert.strictEqual(result.isOk(), true);
            assert.strictEqual(result.unwrap(), 27); // Length of "Initial error" is 13; 13 * 2 + 1 = 27
        });
    
        test('Chained orElse maintains original Ok', () => {
            const result = ok(5)
                .orElse(() => ok(0))
                .andThen((data) => ok(data * 2));
    
            assert.strictEqual(result.isOk(), true);
            assert.strictEqual(result.unwrap(), 10);
        });
    
        test('Mixed andThen and orElse chains', () => {
            const result = ok<number, string>(3)
                .andThen<number, string>((data) => ok(data * 3)) // 3 * 3 = 9
                .andThen<number, string>(() => err('Mid-chain error'))
                .orElse((error) => ok(error.length)) // Length of 'Mid-chain error' = 15
                .andThen((data) => ok(data - 5)); // 15 - 5 = 10
    
            assert.strictEqual(result.isOk(), true);
            assert.strictEqual(result.unwrap(), 10);
        });

        test('Chained andThen and orElse 2', () => {
            const result = ok<number, null>(0)
                .orElse(() => ok(1))
                .andThen(num => ok(num + 1));
            assert.ok(result.isOk());
            assert.strictEqual(result.unwrap(), 1);
        });
        
        test('Chained andThen and orElse 3', () => {
            const result = err<number, null>(null)
                .orElse(() => ok(1))
                .andThen(num => ok(num + 1));
            assert.ok(result.isOk());
            assert.strictEqual(result.unwrap(), 2);
        });
        
        test('Chained andThen and orElse 4', () => {
            const result = err<number, null>(null)
                .orElse(() => ok(1))
                .orElse(() => ok(2))
                .orElse(() => ok(3))
                .orElse(() => ok(4))
                .andThen(num => ok(num + 1));
            assert.ok(result.isOk());
            assert.strictEqual(result.unwrap(), 2);
        });
    });

    suite('panic', () => {
        test('should throw provided error message', () => {
            assert.throws(() => {
                panic('Panic Error Message');
            });
        });
    });

    suite('Result-namespace', () => {

        test('is', () => {
            // eslint-disable-next-line local/code-must-handle-result
            assert.strictEqual(Result.is(ok()), true);
            // eslint-disable-next-line local/code-must-handle-result
            assert.strictEqual(Result.is(err()), true);
            assert.strictEqual(Result.is({ isOk: () => {}, isErr: () => {} }), false);
            assert.strictEqual(Result.is({ isOk: () => {} }), false);
            assert.strictEqual(Result.is(5), false);
            assert.strictEqual(Result.is(undefined), false);
            assert.strictEqual(Result.is({}), false);
            assert.strictEqual(Result.is({ isOk: false }), false);
        });

        test('fromThrowable', () => {
            function mightFail(): number {
                throw new Error("Failed!");
            }

            function notFail(): number {
                return 42;
            }

            // not failed
            const result1 = Result.fromThrowable<number, string>(
                notFail, 
                (error: any) => {
                    return error.message;
                }
            );
            
            if (result1.isOk()) {
                assert.strictEqual(result1.data, 42);
            } else {
                assert.fail('Result should be an instance of ok');
            }

            // failed
            const result2 = Result.fromThrowable<number, string>(
                mightFail, 
                (error: any) => {
                    return error.message;
                }
            );

            if (result2.isErr()) {
                assert.strictEqual(result2.error, 'Failed!');
            } else {
                assert.fail('Result should be an instance of err');
            }
        });

        test('fromPromise', async () => {
            async function mightResolve(): Promise<number> {
                return 24;
            }
        
            async function mightReject(): Promise<number> {
                throw new Error("Promise rejected!");
            }
        
            // check the case where the promise resolves successfully
            const resultSuccess = await Result.fromPromise<number, string>(
                mightResolve, 
                (error: any) => error.message
            );

            if (resultSuccess.isOk()) {
                assert.strictEqual(resultSuccess.data, 24);
            } else {
                assert.fail();
            }
        
            // check the case where the promise gets rejected
            const resultFailure = await Result.fromPromise<number, string>(
                mightReject, 
                (error: any) => error.message
            );

            if (resultFailure.isErr()) {
                assert.strictEqual(resultFailure.error, "Promise rejected!");
            } else {
                assert.fail();
            }
        });
    });
});

suite('AsyncResult', () => {
        
    function getAsyncResult(value: boolean): AsyncResult<string, string> {
        if (value) {
            return AsyncResult.ok('ok');
        }
        return AsyncResult.err('err');
    }

    test('GetAsyncOkType & GetAsyncErrType', () => {
        const result = getAsyncResult(true);
        checkTrue<AreEqual<GetAsyncOkType<typeof result>, string>>();
        checkTrue<AreEqual<GetAsyncErrType<typeof result>, string>>();
    });

    test('await for resolving Ok', async () => {
        const result = getAsyncResult(true);
        const resolvedResult = await result;

        assert.ok(resolvedResult.isOk());
        assert.strictEqual(resolvedResult.unwrap(), 'ok');
    });
    
    test('await for resolving Err', async () => {
        const result = getAsyncResult(false);
        const resolvedResult = await result;

        assert.ok(resolvedResult.isErr());
        assert.strictEqual(resolvedResult.unwrapErr(), 'err');
    });

    test('isOk should return true for success', async () => {
        const result = getAsyncResult(true);
        assert.ok(await result.isOk());
    });

    test('isErr should return false for success', async () => {
        const result = await getAsyncResult(true);
        assert.ok(!result.isErr());
    });

    test('unwrap should return value for success', async () => {
        const result = getAsyncResult(true);
        assert.strictEqual(await result.unwrap(), 'ok');
    });

    test('unwrap should throw for error', async () => {
        const result = getAsyncResult(false);
        try {
            await result.unwrap();
            assert.fail('unwrap should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof Error);
        }
    });

    test('unwrapOr should return value for success', async () => {
        const result = getAsyncResult(true);
        assert.strictEqual(await result.unwrapOr('default'), 'ok');
    });

    test('unwrapOr should return default for error', async () => {
        const result = getAsyncResult(false);
        assert.strictEqual(await result.unwrapOr('default'), 'default');
    });

    test('expect should return value for success', async () => {
        const result = getAsyncResult(true);
        assert.strictEqual(await result.expect('error message'), 'ok');
    });

    test('expect should throw custom error for error', async () => {
        const result = getAsyncResult(false);
        try {
            await result.expect('custom error');
            assert.fail('expect should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof Error);
        }
    });

    test('match should call onOk for success', async () => {
        const result = getAsyncResult(true);
        const matched = await result.match(
            data => data.toUpperCase(),
            error => 'error'
        );
        assert.strictEqual(matched, 'OK');
    });

    test('match should call onError for error', async () => {
        const result = getAsyncResult(false);
        const matched = await result.match(
            data => data.toUpperCase(),
            error => 'handled error'
        );
        assert.strictEqual(matched, 'handled error');
    });

    test('map should transform value for success', async () => {
        const result = getAsyncResult(true);
        const mapped = await result.map(data => data.length);
        assert.strictEqual(mapped.unwrap(), 2);
    });

    test('map should not affect error', async () => {
        const result = getAsyncResult(false);
        const mapped = await result.map(data => data.length);
        assert.ok(mapped.isErr());
    });

    test('mapErr should not affect success', async () => {
        const result = getAsyncResult(true);
        const mapped = await result.mapErr(error => new Error('new error'));
        assert.ok(mapped.isOk());
    });

    test('mapErr should transform error', async () => {
        const result = getAsyncResult(false);
        const mapped = await result.mapErr(error => new Error('new error'));
        assert.ok(mapped.isErr());
        assert.strictEqual(mapped.error.message, 'new error');
    });

    suite('andThen', () => {
        test('andThen method should transform async Ok', async () => {
            const result = getAsyncResult(true);
            const transformedResult = await result.andThen(ok => AsyncResult.ok(42));
    
            assert.ok(transformedResult.isOk());
            assert.strictEqual(transformedResult.unwrap(), 42);
        });

        test('andThen method should transform Ok', async () => {
            const result = getAsyncResult(true);
            const transformedResult = await result.andThen(_ => ok(42));
    
            assert.ok(transformedResult.isOk());
            assert.strictEqual(transformedResult.unwrap(), 42);
        });
        
        test('andThen method should transform err', async () => {
            const result = getAsyncResult(false);
            const transformedResult = await result.andThen(ok => AsyncResult.ok(42));
    
            assert.ok(transformedResult.isErr());
            assert.strictEqual(transformedResult.unwrapErr(), 'err');
        });
        
        test('andThen method should transform successful Promise', async () => {
            const result = getAsyncResult(true);
            const transformedResult = await result.andThen(async () => 42);
    
            assert.ok(transformedResult.isOk());
            assert.strictEqual(transformedResult.unwrap(), 42);
        });
        
        test('andThen method should transform failed Promise', async () => {
            const result = getAsyncResult(true);
            const transformedResult = await result.andThen(async () => { throw 'error!'; });
    
            assert.ok(transformedResult.isErr());
            assert.strictEqual(transformedResult.unwrapErr(), 'error!');
        });
    });
    
    suite('orElse', () => {
        test('orElse method should transform async Ok', async () => {
            const result = getAsyncResult(false);
            const transformedResult = await result.orElse(_ => AsyncResult.ok<string, Error>('42'));
    
            assert.ok(transformedResult.isOk());
            assert.strictEqual(transformedResult.unwrap(), '42');
        });

        test('orElse method should transform Ok', async () => {
            const result = getAsyncResult(false);
            const transformedResult = await result.orElse(_ => ok<string, Error>('42'));
    
            assert.ok(transformedResult.isOk());
            assert.strictEqual(transformedResult.unwrap(), '42');
        });
        
        test('orElse method should transform err', async () => {
            const result = getAsyncResult(false);
            const transformedResult = await result.orElse(ok => AsyncResult.ok<string, Error>('42'));
    
            assert.ok(transformedResult.isOk());
            assert.strictEqual(transformedResult.unwrap(), '42');
        });
        
        test('orElse method should transform successful Promise', async () => {
            const result = getAsyncResult(false);
            const transformedResult = await result.orElse(async () => '42');
            
            assert.ok(transformedResult.isOk());
            assert.strictEqual(transformedResult.unwrap(), '42');
        });
        
        test('orElse method should transform failed Promise', async () => {
            const result = getAsyncResult(false);
            const transformedResult = await result.orElse(async () => { throw 'error!'; });
            
            assert.ok(transformedResult.isErr());
            assert.strictEqual(transformedResult.unwrapErr(), 'error!');
        });
    });
    
    test('toPromise should reject with error for AsyncResult.err', async () => {
        // eslint-disable-next-line local/code-must-handle-result
        const result = getAsyncResult(false);
        try {
            await result.toPromise();
            assert.fail('Promise should have been rejected');
        } catch (error) {
            assert.ok(true);
        }
    });

    test('AsyncResult.is', () => {
        assert.strictEqual(AsyncResult.is(AsyncResult.ok()), true);
        assert.strictEqual(AsyncResult.is(AsyncResult.err()), true);
        
        assert.strictEqual(AsyncResult.is(ok()), false);
        assert.strictEqual(AsyncResult.is(err()), false);
        assert.strictEqual(AsyncResult.is({ isOk: () => {}, isErr: () => {} }), false);
        assert.strictEqual(AsyncResult.is({ isOk: () => {} }), false);
        assert.strictEqual(AsyncResult.is(5), false);
        assert.strictEqual(AsyncResult.is(undefined), false);
        assert.strictEqual(AsyncResult.is({}), false);
        assert.strictEqual(AsyncResult.is({ isOk: false }), false);
    });
});