var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ensureInitialized, logExecutionTime, retry } from '../decorators.js';
describe('decorators', () => {
    describe('ensureInitialized', () => {
        it('should wait for initialization before executing method', async () => {
            let initialized = false;
            const initPromise = new Promise(resolve => {
                setTimeout(() => {
                    initialized = true;
                    resolve();
                }, 10);
            });
            class TestClass {
                initializationPromise = initPromise;
                async doSomething() {
                    return initialized;
                }
            }
            __decorate([
                ensureInitialized,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "doSomething", null);
            const instance = new TestClass();
            const result = await instance.doSomething();
            expect(result).toBe(true);
        });
        it('should work without initialization promise', async () => {
            class TestClass {
                async getValue() {
                    return 'success';
                }
            }
            __decorate([
                ensureInitialized,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "getValue", null);
            const instance = new TestClass();
            const result = await instance.getValue();
            expect(result).toBe('success');
        });
        it('should preserve method arguments', async () => {
            class TestClass {
                initializationPromise = Promise.resolve();
                async add(a, b) {
                    return a + b;
                }
            }
            __decorate([
                ensureInitialized,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Number, Number]),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "add", null);
            const instance = new TestClass();
            const result = await instance.add(2, 3);
            expect(result).toBe(5);
        });
        it('should preserve this context', async () => {
            class TestClass {
                initializationPromise = Promise.resolve();
                value = 42;
                async getValue() {
                    return this.value;
                }
            }
            __decorate([
                ensureInitialized,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "getValue", null);
            const instance = new TestClass();
            const result = await instance.getValue();
            expect(result).toBe(42);
        });
    });
    describe('logExecutionTime', () => {
        it('should log successful execution time', async () => {
            const mockLogger = {
                debug: jest.fn(),
                error: jest.fn()
            };
            class TestClass {
                logger = mockLogger;
                async successfulMethod() {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    return 'success';
                }
            }
            __decorate([
                logExecutionTime,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "successfulMethod", null);
            const instance = new TestClass();
            const result = await instance.successfulMethod();
            expect(result).toBe('success');
            expect(mockLogger.debug).toHaveBeenCalledWith('TestClass.successfulMethod completed', expect.objectContaining({ duration: expect.any(Number) }));
            expect(mockLogger.error).not.toHaveBeenCalled();
        });
        it('should log failed execution time', async () => {
            const mockLogger = {
                debug: jest.fn(),
                error: jest.fn()
            };
            class TestClass {
                logger = mockLogger;
                async failingMethod() {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    throw new Error('Test error');
                }
            }
            __decorate([
                logExecutionTime,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "failingMethod", null);
            const instance = new TestClass();
            await expect(instance.failingMethod()).rejects.toThrow('Test error');
            expect(mockLogger.error).toHaveBeenCalledWith('TestClass.failingMethod failed', expect.objectContaining({
                duration: expect.any(Number),
                error: expect.any(Error)
            }));
            expect(mockLogger.debug).not.toHaveBeenCalled();
        });
        it('should work without logger', async () => {
            class TestClass {
                async method() {
                    return 'success';
                }
            }
            __decorate([
                logExecutionTime,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "method", null);
            const instance = new TestClass();
            const result = await instance.method();
            expect(result).toBe('success');
        });
        it('should handle synchronous methods', async () => {
            const mockLogger = {
                debug: jest.fn()
            };
            class TestClass {
                logger = mockLogger;
                async syncMethod() {
                    return 42;
                }
            }
            __decorate([
                logExecutionTime,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "syncMethod", null);
            const instance = new TestClass();
            const result = await instance.syncMethod();
            expect(result).toBe(42);
            expect(mockLogger.debug).toHaveBeenCalledWith('TestClass.syncMethod completed', expect.objectContaining({ duration: expect.any(Number) }));
        });
    });
    describe('retry', () => {
        it('should retry failed operations', async () => {
            let attempts = 0;
            const mockLogger = {
                warn: jest.fn()
            };
            class TestClass {
                logger = mockLogger;
                async flakyMethod() {
                    attempts++;
                    if (attempts < 3) {
                        throw new Error(`Attempt ${attempts} failed`);
                    }
                    return 'success';
                }
            }
            __decorate([
                retry(3, 10),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "flakyMethod", null);
            const instance = new TestClass();
            const result = await instance.flakyMethod();
            expect(result).toBe('success');
            expect(attempts).toBe(3);
            expect(mockLogger.warn).toHaveBeenCalledTimes(2);
        });
        it('should throw after max attempts', async () => {
            let attempts = 0;
            class TestClass {
                async alwaysFailingMethod() {
                    attempts++;
                    throw new Error(`Attempt ${attempts}`);
                }
            }
            __decorate([
                retry(2, 10),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "alwaysFailingMethod", null);
            const instance = new TestClass();
            await expect(instance.alwaysFailingMethod()).rejects.toThrow('Attempt 2');
            expect(attempts).toBe(2);
        });
        it('should use exponential backoff', async () => {
            jest.useFakeTimers();
            let attempts = 0;
            const delays = [];
            class TestClass {
                async method() {
                    attempts++;
                    delays.push(Date.now());
                    if (attempts < 3) {
                        throw new Error('fail');
                    }
                    return 'success';
                }
            }
            __decorate([
                retry(3, 100),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "method", null);
            const instance = new TestClass();
            const promise = instance.method();
            // First attempt fails immediately
            await jest.advanceTimersByTimeAsync(0);
            expect(attempts).toBe(1);
            // Second attempt after 100ms (initial delay)
            await jest.advanceTimersByTimeAsync(100);
            expect(attempts).toBe(2);
            // Third attempt after 200ms (100 * 2^1)
            await jest.advanceTimersByTimeAsync(200);
            expect(attempts).toBe(3);
            const result = await promise;
            expect(result).toBe('success');
            jest.useRealTimers();
        });
        it('should work without logger', async () => {
            let attempts = 0;
            class TestClass {
                async method() {
                    attempts++;
                    if (attempts < 2) {
                        throw new Error('fail');
                    }
                    return 'success';
                }
            }
            __decorate([
                retry(3, 10),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "method", null);
            const instance = new TestClass();
            const result = await instance.method();
            expect(result).toBe('success');
            expect(attempts).toBe(2);
        });
        it('should use default parameters', async () => {
            let attempts = 0;
            class TestClass {
                async method() {
                    attempts++;
                    if (attempts < 2) {
                        throw new Error('fail');
                    }
                    return 'success';
                }
            }
            __decorate([
                retry(),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "method", null);
            const instance = new TestClass();
            const result = await instance.method();
            expect(result).toBe('success');
            expect(attempts).toBe(2);
        });
        it('should preserve method arguments and context', async () => {
            class TestClass {
                multiplier = 2;
                async multiply(a, b) {
                    return a * b * this.multiplier;
                }
            }
            __decorate([
                retry(2, 10),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Number, Number]),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "multiply", null);
            const instance = new TestClass();
            const result = await instance.multiply(3, 4);
            expect(result).toBe(24);
        });
    });
    describe('decorator combination', () => {
        it('should work with multiple decorators', async () => {
            const mockLogger = {
                debug: jest.fn(),
                warn: jest.fn()
            };
            let attempts = 0;
            class TestClass {
                logger = mockLogger;
                initializationPromise = Promise.resolve();
                async complexMethod() {
                    attempts++;
                    if (attempts < 2) {
                        throw new Error('fail');
                    }
                    return 'success';
                }
            }
            __decorate([
                ensureInitialized,
                logExecutionTime,
                retry(3, 10),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", Promise)
            ], TestClass.prototype, "complexMethod", null);
            const instance = new TestClass();
            const result = await instance.complexMethod();
            expect(result).toBe('success');
            expect(attempts).toBe(2);
            expect(mockLogger.warn).toHaveBeenCalled(); // From retry
            expect(mockLogger.debug).toHaveBeenCalled(); // From logExecutionTime
        });
    });
});
//# sourceMappingURL=decorators.test.js.map