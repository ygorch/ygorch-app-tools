import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/dist/transformers.js';

// Desativa cache local de Node e usa IndexedDB nativo do HF
env.allowLocalModels = false;
env.useBrowserCache = true;

// Keep track of the pipeline instance
let transcriber = null;

self.onmessage = async (e) => {
  const { type, modelId, language, audioData1, audioData2, speaker1Name, speaker2Name } = e.data;

  if (type === 'load') {
    try {
      // Load pipeline if not already loaded with the requested model
      if (!transcriber || transcriber.model !== modelId) {
        self.postMessage({ status: 'loading', message: `Carregando modelo ${modelId}...` });

        transcriber = await pipeline('automatic-speech-recognition', modelId, {
            device: 'webgpu',
            progress_callback: (info) => {
              if (info.status === 'progress') {
                  self.postMessage({ status: 'progress', message: `Baixando modelo: ${Math.round(info.progress)}%`, progress: info.progress });
              }
            }
        });
      }
      self.postMessage({ status: 'ready' });
    } catch (error) {
      self.postMessage({ status: 'error', message: `Erro ao carregar modelo: ${error.message}` });
    }
  }

  else if (type === 'transcribe') {
    if (!transcriber) {
      self.postMessage({ status: 'error', message: 'Modelo não carregado' });
      return;
    }

    try {
      self.postMessage({ status: 'transcribing', message: `Transcrevendo áudio de ${speaker1Name}...` });



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

        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: 'word',
        ...(language !== 'auto' ? { language } : {}),
      };


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

      self.postMessage({ status: 'transcribing', message: `Transcrevendo áudio de ${speaker2Name}...` });

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


      self.postMessage({ status: 'merging', message: 'Mesclando e formatando resultados...' });

      // Helper to group words into phrases with a max pause
      const groupWordsIntoPhrases = (chunks, speakerName, source) => {
          if (!chunks || chunks.length === 0) return [];

          const MAX_PAUSE = 1.5; // 1.5 seconds gap splits the phrase
          const phrases = [];

          let currentPhrase = {
              speaker: speakerName,
              source,
              start: chunks[0].timestamp[0],
              end: chunks[0].timestamp[1],
              text: chunks[0].text
          };

          for (let i = 1; i < chunks.length; i++) {
              const word = chunks[i];
              const gap = word.timestamp[0] - currentPhrase.end;

              if (gap > MAX_PAUSE) {
                  // Push current and start new
                  phrases.push(currentPhrase);
                  currentPhrase = {
                      speaker: speakerName,
                      source,
                      start: word.timestamp[0],
                      end: word.timestamp[1],
                      text: word.text
                  };
              } else {
                  // Append to current
                  currentPhrase.end = word.timestamp[1];
                  currentPhrase.text += (word.text.startsWith(' ') || word.text.startsWith('.') || word.text.startsWith(',') || word.text.startsWith('?')) ? word.text : ' ' + word.text;
              }
          }
          phrases.push(currentPhrase);
          return phrases;
      };

      // 3. Merge & Sort Chunks
      const phrases1 = groupWordsIntoPhrases(result1.chunks, speaker1Name, 'mic');
      const phrases2 = groupWordsIntoPhrases(result2.chunks, speaker2Name, 'system');

      // Merge arrays
      const mergedPhrases = [...phrases1, ...phrases2];

      // Sort by start timestamp
      mergedPhrases.sort((a, b) => a.start - b.start);

      // Format JSON
      const finalJson = {
        speakers: { 1: speaker1Name, 2: speaker2Name },
        language: language,
        model: modelId,
        date: new Date().toISOString(),
        transcription: mergedPhrases.map(phrase => ({
          speaker: phrase.speaker,
          start: phrase.start,
          end: phrase.end,
          text: phrase.text.trim()
        }))
      };


      self.postMessage({ status: 'complete', result: JSON.stringify(finalJson, null, 2) });

    } catch (error) {
      self.postMessage({ status: 'error', message: `Erro na transcrição: ${error.message}` });
    }
  }
};
