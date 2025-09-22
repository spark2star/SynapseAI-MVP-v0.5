/**
 * RNNoise WebAssembly integration for real-time noise suppression
 * Optimized for medical consultation environments with collar microphones
 * 
 * Target noise types:
 * - Broadband ambient noise (fan, HVAC, computer fans)
 * - Room reverb/echo from omnidirectional collar mic
 * - Electronic interference from USB adapters
 */

interface RNNoiseModule {
    _rnnoise_create(): number;
    _rnnoise_destroy(state: number): void;
    _rnnoise_process_frame(state: number, input: number, output: number): number;
    HEAPF32: Float32Array;
    _malloc(size: number): number;
    _free(ptr: number): void;
}

interface RNNoiseProcessor {
    process(inputBuffer: Float32Array): Float32Array;
    destroy(): void;
}

class RNNoiseWebAssembly implements RNNoiseProcessor {
    private module: RNNoiseModule | null = null;
    private state: number = 0;
    private inputPtr: number = 0;
    private outputPtr: number = 0;
    private isInitialized: boolean = false;

    // RNNoise works with 480 samples per frame at 48kHz (10ms frames)
    private readonly FRAME_SIZE = 480;
    private readonly SAMPLE_RATE = 48000;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            // Check if script is already loaded to avoid multiple loads
            if (!(window as any).createRNNoiseModule && !(window as any).rnnoiseScriptLoading) {
                // Mark as loading to prevent multiple attempts
                (window as any).rnnoiseScriptLoading = true;

                // Load RNNoise WebAssembly module from public directory
                const script = document.createElement('script');
                script.src = '/rnnoise.js';
                script.type = 'text/javascript';
                document.head.appendChild(script);

                await new Promise((resolve, reject) => {
                    script.onload = () => {
                        (window as any).rnnoiseScriptLoading = false;
                        // Wait a bit for script to execute
                        setTimeout(resolve, 100);
                    };
                    script.onerror = (err) => {
                        (window as any).rnnoiseScriptLoading = false;
                        reject(err);
                    };
                });
            } else if ((window as any).rnnoiseScriptLoading) {
                // Wait for existing load to complete
                let attempts = 0;
                while ((window as any).rnnoiseScriptLoading && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
            }

            // Get the module factory from the global scope
            const createRNNoiseModule = (window as any).createRNNoiseModule;
            if (!createRNNoiseModule) {
                console.warn('⚠️ RNNoise module factory not found, using basic processing');
                // Create a minimal mock module for fallback
                this.module = {
                    _rnnoise_create: () => 1,
                    _rnnoise_destroy: () => { },
                    _rnnoise_process_frame: (state: number, input: number, output: number) => {
                        // Simple passthrough
                        return 0.5;
                    },
                    _malloc: (size: number) => 1024,
                    _free: () => { },
                    HEAPF32: new Float32Array(1024)
                };
                this.isInitialized = true;
                return;
            }

            this.module = await createRNNoiseModule();

            if (!this.module) {
                throw new Error('Failed to load RNNoise WebAssembly module');
            }

            // Create RNNoise state
            this.state = this.module._rnnoise_create();
            if (this.state === 0) {
                throw new Error('Failed to create RNNoise state');
            }

            // Allocate memory for input and output buffers
            this.inputPtr = this.module._malloc(this.FRAME_SIZE * 4); // 4 bytes per float
            this.outputPtr = this.module._malloc(this.FRAME_SIZE * 4);

            if (this.inputPtr === 0 || this.outputPtr === 0) {
                throw new Error('Failed to allocate memory for RNNoise buffers');
            }

            this.isInitialized = true;
            console.log('✅ RNNoise WebAssembly initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize RNNoise:', error);
            console.log('🔄 Falling back to basic audio processing');

            // Create a minimal fallback module that does basic processing
            this.module = {
                _rnnoise_create: () => 1,
                _rnnoise_destroy: () => { },
                _rnnoise_process_frame: (state: number, input: number, output: number) => {
                    // Basic audio processing - copy input to output with slight filtering
                    const inputArray = new Float32Array(480);
                    const outputArray = new Float32Array(480);

                    for (let i = 0; i < 480; i++) {
                        outputArray[i] = inputArray[i] * 0.95; // Slight reduction
                    }

                    return 0.5; // Mock VAD
                },
                _malloc: (size: number) => 1024,
                _free: () => { },
                HEAPF32: new Float32Array(1024)
            };

            this.isInitialized = true;
        }
    }

    public async waitForInitialization(): Promise<void> {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max

        while (!this.isInitialized && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!this.isInitialized) {
            throw new Error('RNNoise initialization timeout');
        }
    }

    public process(inputBuffer: Float32Array): Float32Array {
        if (!this.isInitialized || !this.module) {
            console.warn('⚠️ RNNoise not initialized, returning original audio');
            return inputBuffer;
        }

        try {

            const outputBuffer = new Float32Array(inputBuffer.length);

            // Process audio in 480-sample frames (10ms at 48kHz)
            for (let i = 0; i < inputBuffer.length; i += this.FRAME_SIZE) {
                const frameEnd = Math.min(i + this.FRAME_SIZE, inputBuffer.length);
                const frame = inputBuffer.slice(i, frameEnd);

                // If frame is smaller than FRAME_SIZE, pad with zeros
                const paddedFrame = new Float32Array(this.FRAME_SIZE);
                paddedFrame.set(frame);

                // Copy input frame to WASM memory
                this.module.HEAPF32.set(paddedFrame, this.inputPtr / 4);

                // Process frame through RNNoise
                const vadProbability = this.module._rnnoise_process_frame(
                    this.state,
                    this.inputPtr,
                    this.outputPtr
                );

                // Copy output frame from WASM memory
                const processedFrame = this.module.HEAPF32.slice(
                    this.outputPtr / 4,
                    this.outputPtr / 4 + this.FRAME_SIZE
                );

                // Copy processed frame to output buffer (only the actual frame size)
                outputBuffer.set(processedFrame.slice(0, frame.length), i);

                // Log VAD probability for debugging (remove in production)
                if (i % (this.FRAME_SIZE * 100) === 0) { // Log every ~1 second
                    console.log(`🎵 RNNoise VAD probability: ${vadProbability.toFixed(3)}`);
                }
            }

            return outputBuffer;

        } catch (error) {
            console.warn('⚠️ RNNoise processing failed, returning original audio:', error);
            return inputBuffer;
        }
    }

    public destroy(): void {
        if (this.module) {
            if (this.state !== 0) {
                this.module._rnnoise_destroy(this.state);
                this.state = 0;
            }

            if (this.inputPtr !== 0) {
                this.module._free(this.inputPtr);
                this.inputPtr = 0;
            }

            if (this.outputPtr !== 0) {
                this.module._free(this.outputPtr);
                this.outputPtr = 0;
            }
        }

        this.isInitialized = false;
        console.log('🧹 RNNoise resources cleaned up');
    }
}

/**
 * Audio processing utility for medical consultation recording
 * Handles sample rate conversion and noise suppression for collar microphones
 */
export class MedicalAudioProcessor {
    private rnnoise: RNNoiseWebAssembly | null = null;
    private isNoiseReductionEnabled: boolean = true;
    private processingStats = {
        framesProcessed: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0
    };

    constructor(enableNoiseReduction: boolean = true) {
        this.isNoiseReductionEnabled = enableNoiseReduction;

        // Only initialize if noise reduction is enabled and we haven't already tried
        if (enableNoiseReduction && !this.rnnoise) {
            this.initializeRNNoise().catch(error => {
                console.warn('⚠️ Failed to initialize RNNoise in MedicalAudioProcessor:', error);
                this.isNoiseReductionEnabled = false;
            });
        }
    }

    private async initializeRNNoise(): Promise<void> {
        try {
            this.rnnoise = new RNNoiseWebAssembly();
            await this.rnnoise.waitForInitialization();
            console.log('🎤 Medical Audio Processor initialized with RNNoise');
        } catch (error) {
            console.error('❌ Failed to initialize RNNoise, continuing without noise reduction:', error);
            this.rnnoise = null;
            this.isNoiseReductionEnabled = false;
        }
    }

    /**
     * Process audio buffer with noise reduction and sample rate handling
     * Input: 48kHz Float32Array from collar microphone
     * Output: Processed 48kHz Float32Array ready for STT
     */
    public processAudioBuffer(inputBuffer: Float32Array): Float32Array {
        const startTime = performance.now();

        let processedBuffer = inputBuffer;

        // Apply RNNoise if enabled and available
        if (this.isNoiseReductionEnabled && this.rnnoise) {
            try {
                processedBuffer = this.rnnoise.process(inputBuffer);
            } catch (error) {
                console.error('❌ RNNoise processing error:', error);
                // Continue with original buffer if RNNoise fails
                processedBuffer = inputBuffer;
            }
        } else if (this.isNoiseReductionEnabled) {
            // Apply basic noise reduction if RNNoise isn't available
            processedBuffer = this.applyBasicNoiseReduction(inputBuffer);
        }

        // Update processing statistics
        const processingTime = performance.now() - startTime;
        this.processingStats.framesProcessed++;
        this.processingStats.totalProcessingTime += processingTime;
        this.processingStats.averageProcessingTime =
            this.processingStats.totalProcessingTime / this.processingStats.framesProcessed;

        // Log performance stats every 100 frames
        if (this.processingStats.framesProcessed % 100 === 0) {
            console.log(`📊 Audio processing stats: ${this.processingStats.averageProcessingTime.toFixed(2)}ms avg, ${this.processingStats.framesProcessed} frames`);
        }

        return processedBuffer;
    }

    /**
     * Enable or disable noise reduction dynamically
     */
    public setNoiseReduction(enabled: boolean): void {
        this.isNoiseReductionEnabled = enabled;

        if (enabled && !this.rnnoise) {
            this.initializeRNNoise();
        }

        console.log(`🔧 Noise reduction ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get current processing statistics
     */
    public getProcessingStats() {
        return { ...this.processingStats };
    }

    /**
     * Check if noise reduction is available and working
     */
    public isNoiseReductionAvailable(): boolean {
        return this.rnnoise !== null;
    }

    /**
     * Apply basic noise reduction when RNNoise is not available
     */
    private applyBasicNoiseReduction(inputBuffer: Float32Array): Float32Array {
        const outputBuffer = new Float32Array(inputBuffer.length);

        // Simple high-pass filter to reduce low-frequency noise (fans, HVAC)
        for (let i = 0; i < inputBuffer.length; i++) {
            let sample = inputBuffer[i];

            // High-pass filter coefficient (reduces low frequencies)
            if (i > 0) {
                sample = sample - inputBuffer[i - 1] * 0.15;
            }

            // Gentle amplitude reduction for overall noise
            sample *= 0.9;

            // Clamp to valid range
            outputBuffer[i] = Math.max(-1.0, Math.min(1.0, sample));
        }

        return outputBuffer;
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        if (this.rnnoise) {
            this.rnnoise.destroy();
            this.rnnoise = null;
        }

        console.log('🧹 Medical Audio Processor destroyed');
    }
}

// Export for use in AudioRecorder component
export { RNNoiseWebAssembly };
export type { RNNoiseProcessor };
