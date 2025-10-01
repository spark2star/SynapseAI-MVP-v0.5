/**
 * AudioWorklet Processor for Real-time Audio Capture
 * Converts Float32 audio to Int16 LINEAR16 format for Speech-to-Text
 * 
 * This replaces the deprecated ScriptProcessorNode with modern AudioWorkletNode
 */

class AudioCaptureProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.chunksSent = 0
        this.lastLogTime = 0
    }

    /**
     * Process audio in real-time
     * Called automatically by the browser for each audio buffer
     * 
     * @param {Float32Array[][]} inputs - Input audio buffers [input][channel]
     * @param {Float32Array[][]} outputs - Output audio buffers (unused)
     * @param {Object} parameters - Audio parameters (unused)
     * @returns {boolean} - Return true to keep processor alive
     */
    process(inputs, outputs, parameters) {
        const input = inputs[0]

        // Check if we have input audio
        if (!input || input.length === 0) {
            return true  // Keep processor alive even without input
        }

        // Get the first channel (mono audio)
        const inputChannel = input[0]

        if (!inputChannel || inputChannel.length === 0) {
            return true
        }

        // Convert Float32 [-1.0, 1.0] to Int16 [-32768, 32767]
        const outputData = new Int16Array(inputChannel.length)

        for (let i = 0; i < inputChannel.length; i++) {
            // Clamp to [-1.0, 1.0] and convert to Int16
            const sample = Math.max(-1, Math.min(1, inputChannel[i]))
            outputData[i] = sample < 0 ? sample * 32768 : sample * 32767
        }

        // Send audio data to main thread
        this.port.postMessage({
            type: 'audio',
            data: outputData.buffer
        }, [outputData.buffer])  // Transfer ownership for performance

        this.chunksSent++

        // Log every 10 seconds (assuming 128 samples @ 16kHz = ~125 chunks/sec)
        const now = currentTime
        if (now - this.lastLogTime > 10) {
            this.port.postMessage({
                type: 'log',
                message: `AudioWorklet: ${this.chunksSent} chunks processed (${(this.chunksSent * 128 / 16000).toFixed(1)}s of audio)`
            })
            this.lastLogTime = now
        }

        return true  // Keep processor alive
    }
}

// Register the processor
registerProcessor('audio-capture-processor', AudioCaptureProcessor)

