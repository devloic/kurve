/**
 * Browser-compatible Buffer shim for Colyseus
 * This provides a minimal Buffer implementation that Colyseus needs
 */

'use strict';

(function(global) {
    // If Buffer already exists, don't override it
    if (typeof global.Buffer !== 'undefined') {
        return;
    }

    // Simple Buffer implementation using Uint8Array
    function BufferShim(arg, encodingOrOffset, length) {
        if (typeof arg === 'number') {
            return new Uint8Array(arg);
        }
        if (typeof arg === 'string') {
            return stringToUint8Array(arg, encodingOrOffset);
        }
        if (arg instanceof ArrayBuffer || ArrayBuffer.isView(arg)) {
            return new Uint8Array(arg, encodingOrOffset, length);
        }
        if (Array.isArray(arg)) {
            return new Uint8Array(arg);
        }
        return new Uint8Array(0);
    }

    function stringToUint8Array(str, encoding) {
        encoding = encoding || 'utf8';
        var arr = [];
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            if (encoding === 'utf8' && code > 127) {
                // Simple UTF-8 encoding for multi-byte characters
                if (code < 2048) {
                    arr.push((code >> 6) | 192);
                    arr.push((code & 63) | 128);
                } else {
                    arr.push((code >> 12) | 224);
                    arr.push(((code >> 6) & 63) | 128);
                    arr.push((code & 63) | 128);
                }
            } else {
                arr.push(code & 0xff);
            }
        }
        return new Uint8Array(arr);
    }

    function uint8ArrayToString(arr, encoding) {
        encoding = encoding || 'utf8';
        var str = '';
        for (var i = 0; i < arr.length; i++) {
            str += String.fromCharCode(arr[i]);
        }
        return str;
    }

    // Static methods
    BufferShim.isBuffer = function(obj) {
        return obj instanceof Uint8Array ||
               (obj && obj.constructor && obj.constructor.name === 'Uint8Array');
    };

    BufferShim.from = function(value, encodingOrOffset, length) {
        return BufferShim(value, encodingOrOffset, length);
    };

    BufferShim.alloc = function(size, fill, encoding) {
        var buf = new Uint8Array(size);
        if (fill !== undefined) {
            if (typeof fill === 'number') {
                buf.fill(fill);
            } else if (typeof fill === 'string') {
                var fillBuf = stringToUint8Array(fill, encoding);
                for (var i = 0; i < size; i++) {
                    buf[i] = fillBuf[i % fillBuf.length];
                }
            }
        }
        return buf;
    };

    BufferShim.allocUnsafe = function(size) {
        return new Uint8Array(size);
    };

    BufferShim.allocUnsafeSlow = function(size) {
        return new Uint8Array(size);
    };

    BufferShim.concat = function(list, totalLength) {
        if (!Array.isArray(list)) {
            throw new TypeError('list must be an array');
        }

        if (list.length === 0) {
            return new Uint8Array(0);
        }

        var length = 0;
        if (totalLength === undefined) {
            for (var i = 0; i < list.length; i++) {
                length += list[i].length;
            }
        } else {
            length = totalLength;
        }

        var buffer = new Uint8Array(length);
        var pos = 0;
        for (var i = 0; i < list.length; i++) {
            var buf = list[i];
            if (!BufferShim.isBuffer(buf)) {
                throw new TypeError('list items must be Buffers');
            }
            buffer.set(buf, pos);
            pos += buf.length;
            if (pos >= length) break;
        }

        return buffer;
    };

    BufferShim.byteLength = function(string, encoding) {
        if (typeof string !== 'string') {
            return string.length;
        }
        return stringToUint8Array(string, encoding).length;
    };

    BufferShim.compare = function(a, b) {
        for (var i = 0; i < Math.min(a.length, b.length); i++) {
            if (a[i] !== b[i]) {
                return a[i] < b[i] ? -1 : 1;
            }
        }
        return a.length - b.length;
    };

    // Set up global Buffer
    global.Buffer = BufferShim;

    // Also set up global.global for libraries that expect it
    if (!global.global) {
        global.global = global;
    }

    // Set up process.browser flag
    if (!global.process) {
        global.process = { browser: true, env: {}, version: '', versions: {} };
    } else if (!global.process.browser) {
        global.process.browser = true;
    }

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
