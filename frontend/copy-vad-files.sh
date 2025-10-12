#!/bin/bash
echo "📦 Copying VAD model files to /public..."
cd "$(dirname "$0")"

# Copy ONNX models
cp node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx public/silero_vad.onnx
cp node_modules/@ricky0123/vad-web/dist/silero_vad_legacy.onnx public/

# Copy worklet
cp node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js public/

# Copy ONNX Runtime WASM files
cp node_modules/onnxruntime-web/dist/*.wasm public/ 2>/dev/null || true
cp node_modules/onnxruntime-web/dist/*.mjs public/ 2>/dev/null || true

echo "✅ Files copied. Verifying..."
ls -lh public/*.{onnx,wasm,js} | grep -E '(onnx|wasm|vad)'
echo "✅ Done! Restart your dev server."

