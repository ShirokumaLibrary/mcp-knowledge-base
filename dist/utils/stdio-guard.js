export function guardStdio() {
    if (process.env.NODE_ENV === 'test' || process.env.MCP_MODE === 'false') {
        return;
    }
    if (process.env.NODE_ENV === 'production' || process.env.MCP_GUARD_STDIO === 'true') {
        try {
            const originalStdoutWrite = process.stdout.write.bind(process.stdout);
            process.stderr.write = function () {
                return true;
            };
            process.stdout.write = function (chunk, encoding, callback) {
                if (typeof encoding === 'function') {
                    callback = encoding;
                    encoding = undefined;
                }
                const str = String(chunk);
                if (str.trim().startsWith('{') && (str.includes('"jsonrpc"') || str.includes('"result"') || str.includes('"method"'))) {
                    originalStdoutWrite.call(process.stdout, str, encoding, callback);
                }
                else if (str.trim() === '') {
                    originalStdoutWrite.call(process.stdout, str, encoding, callback);
                }
                if (callback) {
                    callback();
                }
                return true;
            };
            const noop = () => { };
            console.error = noop;
            console.warn = noop;
            console.log = noop;
            console.info = noop;
            console.debug = noop;
            console.trace = noop;
            process.emitWarning = noop;
        }
        catch {
        }
    }
}
