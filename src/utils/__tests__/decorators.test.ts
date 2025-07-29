import { ensureInitialized, logExecutionTime, retry } from '../decorators.js';

describe('decorators', () => {
  describe('ensureInitialized', () => {
    it('should wait for initialization before executing method', async () => {
      let initialized = false;
      const initPromise = new Promise<void>(resolve => {
        setTimeout(() => {
          initialized = true;
          resolve();
        }, 10);
      });

      class TestClass {
        initializationPromise = initPromise;

        @ensureInitialized
        async doSomething() {
          return initialized;
        }
      }

      const instance = new TestClass();
      const result = await instance.doSomething();
      
      expect(result).toBe(true);
    });

    it('should work without initialization promise', async () => {
      class TestClass {
        @ensureInitialized
        async getValue() {
          return 'success';
        }
      }

      const instance = new TestClass();
      const result = await instance.getValue();
      
      expect(result).toBe('success');
    });

    it('should preserve method arguments', async () => {
      class TestClass {
        initializationPromise = Promise.resolve();

        @ensureInitialized
        async add(a: number, b: number) {
          return a + b;
        }
      }

      const instance = new TestClass();
      const result = await instance.add(2, 3);
      
      expect(result).toBe(5);
    });

    it('should preserve this context', async () => {
      class TestClass {
        initializationPromise = Promise.resolve();
        value = 42;

        @ensureInitialized
        async getValue() {
          return this.value;
        }
      }

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

        @logExecutionTime
        async successfulMethod() {
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'success';
        }
      }

      const instance = new TestClass();
      const result = await instance.successfulMethod();
      
      expect(result).toBe('success');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'TestClass.successfulMethod completed',
        expect.objectContaining({ duration: expect.any(Number) })
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log failed execution time', async () => {
      const mockLogger = {
        debug: jest.fn(),
        error: jest.fn()
      };

      class TestClass {
        logger = mockLogger;

        @logExecutionTime
        async failingMethod() {
          await new Promise(resolve => setTimeout(resolve, 50));
          throw new Error('Test error');
        }
      }

      const instance = new TestClass();
      
      await expect(instance.failingMethod()).rejects.toThrow('Test error');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'TestClass.failingMethod failed',
        expect.objectContaining({
          duration: expect.any(Number),
          error: expect.any(Error)
        })
      );
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('should work without logger', async () => {
      class TestClass {
        @logExecutionTime
        async method() {
          return 'success';
        }
      }

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

        @logExecutionTime
        async syncMethod() {
          return 42;
        }
      }

      const instance = new TestClass();
      const result = await instance.syncMethod();
      
      expect(result).toBe(42);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'TestClass.syncMethod completed',
        expect.objectContaining({ duration: expect.any(Number) })
      );
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

        @retry(3, 10)
        async flakyMethod() {
          attempts++;
          if (attempts < 3) {
            throw new Error(`Attempt ${attempts} failed`);
          }
          return 'success';
        }
      }

      const instance = new TestClass();
      const result = await instance.flakyMethod();
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts', async () => {
      let attempts = 0;

      class TestClass {
        @retry(2, 10)
        async alwaysFailingMethod() {
          attempts++;
          throw new Error(`Attempt ${attempts}`);
        }
      }

      const instance = new TestClass();
      
      await expect(instance.alwaysFailingMethod()).rejects.toThrow('Attempt 2');
      expect(attempts).toBe(2);
    });

    it('should use exponential backoff', async () => {
      jest.useFakeTimers();
      let attempts = 0;
      const delays: number[] = [];

      class TestClass {
        @retry(3, 100)
        async method() {
          attempts++;
          delays.push(Date.now());
          if (attempts < 3) {
            throw new Error('fail');
          }
          return 'success';
        }
      }

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
        @retry(3, 10)
        async method() {
          attempts++;
          if (attempts < 2) {
            throw new Error('fail');
          }
          return 'success';
        }
      }

      const instance = new TestClass();
      const result = await instance.method();
      
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should use default parameters', async () => {
      let attempts = 0;

      class TestClass {
        @retry()
        async method() {
          attempts++;
          if (attempts < 2) {
            throw new Error('fail');
          }
          return 'success';
        }
      }

      const instance = new TestClass();
      const result = await instance.method();
      
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should preserve method arguments and context', async () => {
      class TestClass {
        multiplier = 2;

        @retry(2, 10)
        async multiply(a: number, b: number) {
          return a * b * this.multiplier;
        }
      }

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

        @ensureInitialized
        @logExecutionTime
        @retry(3, 10)
        async complexMethod() {
          attempts++;
          if (attempts < 2) {
            throw new Error('fail');
          }
          return 'success';
        }
      }

      const instance = new TestClass();
      const result = await instance.complexMethod();
      
      expect(result).toBe('success');
      expect(attempts).toBe(2);
      expect(mockLogger.warn).toHaveBeenCalled(); // From retry
      expect(mockLogger.debug).toHaveBeenCalled(); // From logExecutionTime
    });
  });
});