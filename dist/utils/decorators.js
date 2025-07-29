export function ensureInitialized(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return originalMethod.apply(this, args);
    };
    return descriptor;
}
export function logExecutionTime(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        const start = performance.now();
        const className = target.constructor.name;
        try {
            const result = await originalMethod.apply(this, args);
            const duration = performance.now() - start;
            if (this.logger) {
                this.logger.debug(`${className}.${propertyKey} completed`, { duration });
            }
            return result;
        }
        catch (error) {
            const duration = performance.now() - start;
            if (this.logger) {
                this.logger.error(`${className}.${propertyKey} failed`, { duration, error });
            }
            throw error;
        }
    };
    return descriptor;
}
export function retry(maxAttempts = 3, initialDelay = 1000) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            let lastError;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    return await originalMethod.apply(this, args);
                }
                catch (error) {
                    lastError = error;
                    if (attempt < maxAttempts) {
                        const delay = initialDelay * Math.pow(2, attempt - 1);
                        if (this.logger) {
                            this.logger.warn(`${propertyKey} failed, retrying`, {
                                attempt,
                                maxAttempts,
                                delay,
                                error
                            });
                        }
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            throw lastError;
        };
        return descriptor;
    };
}
