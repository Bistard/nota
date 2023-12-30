import * as assert from 'assert';
import { AsyncResult, Err, ErrorHandler, InitProtector, Ok, Result, err, ok, panic, tryOrDefault } from 'src/base/common/error';
import { AreEqual, checkTrue, isString } from 'src/base/common/utilities/type';

suite('error-test', () => {
    
    test('setUnexpectedErrorExternalCallback', () => {
        let hit = false;
        
        ErrorHandler.setUnexpectedErrorExternalCallback(err => { hit = true; });
        ErrorHandler.onUnexpectedError(undefined);

        assert.strictEqual(hit, true);
    });

    test('registerListener', () => {
        let hit = 0;
        
        ErrorHandler.setUnexpectedErrorExternalCallback(() => {});

        const listener1 = ErrorHandler.registerListener(() => hit++);
        const listener2 = ErrorHandler.registerListener(() => hit++);

        ErrorHandler.onUnexpectedError(undefined);
        listener1.dispose();
        ErrorHandler.onUnexpectedError(undefined);
        listener2.dispose();
        ErrorHandler.onUnexpectedError(undefined);

        assert.strictEqual(hit, 3);
    });

    test('onUnexpectedExternalError', () => {
        let hit = 0;
        
        ErrorHandler.setUnexpectedErrorExternalCallback(() => hit--);

        const listener = ErrorHandler.registerListener(() => hit++);
        ErrorHandler.onUnexpectedExternalError(undefined);
        
        assert.strictEqual(hit, -1);
    });

    test('tryOrDefault', () => {
        assert.strictEqual(tryOrDefault('bad world', () => 'hello world'), 'hello world');
        assert.strictEqual(tryOrDefault('bad world', () => { throw new Error(); }), 'bad world');
    });

    test('InitProtector', () => {
        const initProtector = new InitProtector();

        const initResult1 = initProtector.init('first init');
        assert.ok(initResult1.isOk());
        
        const initResult2 = initProtector.init('first init');
        assert.ok(initResult2.isErr());
    });
});

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

        test('expect should throw provided error message', () => {
            assert.throws(() => {
                errInstance.expect('Custom Error Message');
            }, {
                message: 'Custom Error Message'
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
    });

    suite('Result', () => {

        function getResult(value: boolean): Result<string, Error> {
            if (value) {
                return ok('ok');
            }
            return err(new Error('err'));
        }

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
    });

    suite('panic', () => {
        test('should throw provided error message', () => {
            assert.throws(() => {
                panic('Panic Error Message');
            }, {
                message: 'Panic Error Message'
            });
        });
    });

    suite('Result-namespace', () => {

        test('is', () => {
            // eslint-disable-next-line local/code-must-handle-result
            assert.strictEqual(Result.is(ok()), true);
            // eslint-disable-next-line local/code-must-handle-result
            assert.strictEqual(Result.is(err()), true);
            assert.strictEqual(Result.is({ isOk: () => {}, isErr: () => {} }), true);
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

        test('getOrPanic', async () => {
            // sync
            // eslint-disable-next-line local/code-must-handle-result
            const data1 = Result.getOrPanic(ok(5));
            assert.strictEqual(data1, 5);

            // async
            // eslint-disable-next-line local/code-must-handle-result
            const data2 = await Result.getOrPanic(Promise.resolve(ok(6)));
            assert.strictEqual(data2, 6);

            // eslint-disable-next-line local/code-must-handle-result
            await assert.rejects(async () => Result.getOrPanic(Promise.resolve(err(7))));
        });
    });

    suite('result-must-handle', () => {

        function returnResult(value: boolean): Result<string, Error> {
            if (value) {
                return ok('ok');
            }
            return err(new Error('err'));
        }
        
        function returnAsyncResult(value: boolean): AsyncResult<string, Error> {
            if (value) {
                return Promise.resolve(ok('ok'));
            }
            return Promise.resolve(err(new Error('err')));
        }

        function resultInParameter(res: Result<void, void>): void {
            // res.unwrap(); // FIX: should mark as unhandled
        }
        
        async function asyncResultInParameter(res: AsyncResult<void, void>): Promise<void> {
            // res.unwrap(); // FIX: should mark as unhandled
        }
        
        test('isOk check', () => {
            const test_result = returnResult(true);
            
            if (test_result.isOk()) return false;
            else return true;
        });
        
        test('isErr check', () => {
            const test_result = returnResult(true);
            if (test_result.isErr()) return false;
            else return true;
        });
        
        test('unwrapOr check', () => {
            const test_result = returnResult(true);
            test_result.unwrapOr('');
        });
        
        test('unwrap check', () => {
            const test_result = returnResult(true);
            test_result.unwrap();
        });
        
        test('match check', () => {
            const test_result = returnResult(true);
            test_result.match(() => {}, () => {});
        });
        
        test('expect check', () => {
            const test_result = returnResult(true);
            test_result.expect('err message');
        });

        test('await keyword', async () => {
            const test_result = await returnAsyncResult(true);
            test_result.unwrap();
        });
        
        test('await keyword', async () => {
            const test_result = returnAsyncResult(true);
            // test_result.unwrap(); // FIX
        });

        test('block check', () => {
            const test_result = returnResult(true);
            {
                test_result.unwrap();
            }
        });

        test('closure check 1', () => {
            const test_result = returnResult(true);
            
            const a = () => {
                test_result.unwrap();
            };
        });

        test('closure check 2', () => {
            const test_result = returnResult(true);

            // eslint-disable-next-line @typescript-eslint/ban-types
            const cb = (fn: Function) => {};
            cb(() => {
                test_result.unwrap();
            });
        });
        
        test('closure check 3', () => {
            const test_result = returnResult(true);
            (() => {
                test_result.unwrap();
            })();
        });

        test.skip('reassignment to the same variable', () => {
            // let res: Result<string, Error> = returnResult(true);
            // res.unwrap();

            // res = returnResult(true);
            // res.unwrap();
        });
    });
});