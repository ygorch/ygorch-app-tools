const fs = require('fs');
let content = fs.readFileSync('public/whisper-worker.js', 'utf8');

const trimFn = `
      // Helper function to remove leading silence and calculate offset
      const trimLeadingSilence = (audioArray, sampleRate = 16000) => {
        const threshold = 0.005; // Very low threshold for silence detection
        const windowSize = Math.floor(sampleRate * 0.05); // 50ms window

        let startIndex = 0;

        for (let i = 0; i < audioArray.length; i += windowSize) {
           let sumSquares = 0;
           let count = 0;
           for (let j = 0; j < windowSize && i + j < audioArray.length; j++) {
              sumSquares += audioArray[i + j] * audioArray[i + j];
              count++;
           }
           const rms = Math.sqrt(sumSquares / count);

           if (rms > threshold) {
              startIndex = Math.max(0, i - windowSize); // Keep a bit of padding before voice
              break;
           }
        }

        const offsetSeconds = startIndex / sampleRate;
        const trimmedAudio = audioArray.slice(startIndex);
        return { trimmedAudio, offsetSeconds };
      };

      const config = {
`;

content = content.replace(/      const config = {/, trimFn);

const transcriptionFn = `
      // 1. Process Audio 1 (Mic)
      const { trimmedAudio: audio1Trimmed, offsetSeconds: offset1 } = trimLeadingSilence(audioData1);
      const result1 = await transcriber(audio1Trimmed, config);

      // Add offset back to all timestamps
      if (result1.chunks) {
         result1.chunks.forEach(chunk => {
             chunk.timestamp[0] += offset1;
             chunk.timestamp[1] += offset1;
         });
      }

      self.postMessage({ status: 'transcribing', message: \`Transcrevendo áudio de \${speaker2Name}...\` });

      // 2. Process Audio 2 (System)
      const { trimmedAudio: audio2Trimmed, offsetSeconds: offset2 } = trimLeadingSilence(audioData2);
      const result2 = await transcriber(audio2Trimmed, config);

      // Add offset back to all timestamps
      if (result2.chunks) {
         result2.chunks.forEach(chunk => {
             chunk.timestamp[0] += offset2;
             chunk.timestamp[1] += offset2;
         });
      }
`;

content = content.replace(
    /\/\/ 1\. Transcribe audio 1 \(Mic\)[\s\S]*?\/\/ 2\. Transcribe audio 2 \(System\)[\s\S]*?const result2 = await transcriber\(audioData2, config\);/,
    transcriptionFn
);

fs.writeFileSync('public/whisper-worker.js', content);
