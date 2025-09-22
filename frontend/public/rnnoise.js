/**
 * RNNoise WebAssembly Module Loader
 * Mock implementation for development and testing
 * 
 * This provides a working noise reduction implementation while you can
 * later replace it with the real RNNoise WebAssembly binary.
 */

async function createRNNoiseModule() {
    console.log('🎵 Loading RNNoise (Mock Implementation)');

    const Module = {
        // Mock memory management
        HEAPF32: new Float32Array(1024 * 1024), // 4MB buffer
        _memoryOffset: 1024,

        _malloc: function (size) {
            const ptr = this._memoryOffset;
            this._memoryOffset += (size + 3) & ~3; // Align to 4 bytes
            return ptr;
        },

        _free: function (ptr) {
            // Mock free - do nothing
        },

        _rnnoise_create: function () {
            console.log('🔧 Creating RNNoise state (mock)');
            return 1; // Return non-zero state
        },

        _rnnoise_destroy: function (state) {
            console.log('🧹 Destroying RNNoise state (mock)');
        },

        _rnnoise_process_frame: function (state, input, output) {
            // Mock noise reduction: simple high-pass filter + amplitude reduction
            const inputFloat32 = new Float32Array(this.HEAPF32.buffer, input, 480);
            const outputFloat32 = new Float32Array(this.HEAPF32.buffer, output, 480);

            // Apply basic noise reduction
            for (let i = 0; i < 480; i++) {
                let sample = inputFloat32[i];

                // Simple high-pass filter to reduce low-frequency noise (fan, HVAC)
                if (i > 0) {
                    sample = sample - inputFloat32[i - 1] * 0.1;
                }

                // Gentle amplitude reduction
                sample *= 0.92;

                // Clamp to valid range
                outputFloat32[i] = Math.max(-1.0, Math.min(1.0, sample));
            }

            // Return mock VAD probability (Voice Activity Detection)
            return Math.random() * 0.4 + 0.4; // 0.4 to 0.8
        }
    };

    console.log('✅ RNNoise module ready (mock implementation)');
    return Module;
}

// Export for browser global scope
if (typeof window !== 'undefined') {
    window.createRNNoiseModule = createRNNoiseModule;
}

// Also support Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createRNNoiseModule;
}
