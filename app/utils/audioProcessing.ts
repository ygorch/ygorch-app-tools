// Decodes any audio blob (webm, mp4, etc) to raw AudioBuffer using browser's AudioContext
export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).webkitAudioContext)({
    sampleRate: 16000, // Whisper expects 16kHz
  });

  return await audioContext.decodeAudioData(arrayBuffer);
}

// Converts AudioBuffer to Float32Array (mono channel) required by Whisper
export function audioBufferToFloat32Array(audioBuffer: AudioBuffer): Float32Array {
  // We only use the first channel (mono)
  return audioBuffer.getChannelData(0);
}

// Interleaves channels for standard WAV creation
function interleave(inputL: Float32Array, inputR: Float32Array) {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);

  let index = 0, inputIndex = 0;

  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Encodes an AudioBuffer into a WAV Blob
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;

  if (numChannels === 2) {
      result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
      result = buffer.getChannelData(0);
  }

  const dataLength = result.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true); // file length - 8
  writeString(view, 8, 'WAVE');

  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size (16 for PCM)
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // byte rate
  view.setUint16(32, numChannels * (bitDepth / 8), true); // block align
  view.setUint16(34, bitDepth, true); // bits per sample

  // Data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

// Main utility to convert WEBM -> WAV Blob and WEBM -> Float32Array (Whisper input)
export async function processAudioFile(blob: Blob) {
  const audioBuffer = await decodeAudioBlob(blob);

  // 1. Get WAV Blob for user download
  const wavBlob = audioBufferToWavBlob(audioBuffer);

  // 2. Get Float32Array (16kHz, mono) for Whisper Worker
  const audioDataForModel = audioBufferToFloat32Array(audioBuffer);

  return { wavBlob, audioDataForModel };
}

// Given two audio blobs recorded simultaneously, ensures their start and end
// are aligned. If one blob started capturing data later than the other,
// this function pads the shorter one with silence at the START to align them.
// Assuming both recorders stopped at exactly the same time.
export async function processAndSyncAudioFiles(blob1: Blob, blob2: Blob) {
  const [buffer1, buffer2] = await Promise.all([
     decodeAudioBlob(blob1),
     decodeAudioBlob(blob2)
  ]);

  const length1 = buffer1.length;
  const length2 = buffer2.length;
  const maxLength = Math.max(length1, length2);
  const sampleRate = buffer1.sampleRate; // Should be 16kHz for both

  const newContext = new (window.AudioContext || (window as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).webkitAudioContext)({ sampleRate });

  // Create new padded buffers
  const paddedBuffer1 = newContext.createBuffer(1, maxLength, sampleRate);
  const paddedBuffer2 = newContext.createBuffer(1, maxLength, sampleRate);

  const channel1 = paddedBuffer1.getChannelData(0);
  const channel2 = paddedBuffer2.getChannelData(0);

  // Pad at the start by writing at the end
  const offset1 = maxLength - length1;
  const offset2 = maxLength - length2;

  channel1.set(buffer1.getChannelData(0), offset1);
  channel2.set(buffer2.getChannelData(0), offset2);

  // Generate WAVs
  const wavBlob1 = audioBufferToWavBlob(paddedBuffer1);
  const wavBlob2 = audioBufferToWavBlob(paddedBuffer2);

  // Generate Float32Arrays for Whisper
  const audioDataForModel1 = audioBufferToFloat32Array(paddedBuffer1);
  const audioDataForModel2 = audioBufferToFloat32Array(paddedBuffer2);

  return {
      wavBlob1,
      wavBlob2,
      audioDataForModel1,
      audioDataForModel2,
  };
}
