/**
 * Buffer polyfill for browser compatibility with Colyseus
 */

'use strict';

(function() {
    // Create a minimal Buffer polyfill for browser
    var BufferPolyfill = {
        isBuffer: function(obj) {
            return obj && obj.constructor &&
                   typeof obj.constructor.isBuffer === 'function' &&
                   obj.constructor.isBuffer(obj);
        },
        from: function(data, encoding) {
            if (typeof data === 'string') {
                var bytes = [];
                for (var i = 0; i < data.length; i++) {
                    bytes.push(data.charCodeAt(i));
                }
                return new Uint8Array(bytes);
            }
            return new Uint8Array(data);
        },
        alloc: function(size) {
            return new Uint8Array(size);
        },
        allocUnsafe: function(size) {
            return new Uint8Array(size);
        },
        concat: function(list, totalLength) {
            if (totalLength === undefined) {
                totalLength = 0;
                for (var i = 0; i < list.length; i++) {
                    totalLength += list[i].length;
                }
            }
            var result = new Uint8Array(totalLength);
            var offset = 0;
            for (var i = 0; i < list.length; i++) {
                result.set(list[i], offset);
                offset += list[i].length;
            }
            return result;
        }
    };

    // Set up global scope
    if (typeof window !== 'undefined') {
        window.Buffer = BufferPolyfill;
        window.global = window.global || window;
        window.global.Buffer = BufferPolyfill;

        // For module systems that might try to require 'buffer'
        if (!window.process) {
            window.process = { browser: true, env: {} };
        }
    }

    // For global scope
    if (typeof global !== 'undefined') {
        global.Buffer = BufferPolyfill;
    }

    // Make Buffer globally available
    if (typeof this !== 'undefined') {
        this.Buffer = BufferPolyfill;
    }
})();
