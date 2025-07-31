import * as fs from 'fs';
import * as path from 'path';
export function guardStdio() {
    if (process.env.NODE_ENV === 'production' || process.env.MCP_GUARD_STDIO === 'true') {
        try {
            const logDir = path.join(process.cwd(), 'logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            const stderrLog = path.join(logDir, `stderr-${Date.now()}.log`);
            const stderrStream = fs.createWriteStream(stderrLog, { flags: 'a' });
            const originalStderrWrite = process.stderr.write.bind(process.stderr);
            const originalStdoutWrite = process.stdout.write.bind(process.stdout);
            let inJsonResponse = false;
            process.stderr.write = function (chunk, encoding, callback) {
                if (typeof encoding === 'function') {
                    callback = encoding;
                    encoding = undefined;
                }
                stderrStream.write(chunk, encoding, callback);
                return true;
            };
            process.stdout.write = function (chunk, encoding, callback) {
                if (typeof encoding === 'function') {
                    callback = encoding;
                    encoding = undefined;
                }
                const str = chunk.toString();
                stderrStream.write(`[STDOUT DEBUG] Length: ${str.length}, First 20 chars: ${JSON.stringify(str.substring(0, 20))}\n`);
                if (str.trim().startsWith('{') || inJsonResponse) {
                    originalStdoutWrite.call(process.stdout, chunk, encoding, callback);
                    inJsonResponse = str.includes('"jsonrpc"');
                }
                else {
                    stderrStream.write('STDOUT NON-JSON: ' + chunk, encoding);
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
        }
        catch (error) {
        }
    }
}
