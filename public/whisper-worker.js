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

      const config = {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
        ...(language !== 'auto' ? { language } : {}),
      };

      // 1. Transcribe audio 1 (Mic)
      const result1 = await transcriber(audioData1, config);

      self.postMessage({ status: 'transcribing', message: `Transcrevendo áudio de ${speaker2Name}...` });

      // 2. Transcribe audio 2 (System)
      const result2 = await transcriber(audioData2, config);

      self.postMessage({ status: 'merging', message: 'Mesclando e formatando resultados...' });

      // 3. Merge & Sort Chunks
      const chunks1 = result1.chunks.map((c) => ({ ...c, speaker: speaker1Name, source: 'mic' }));
      const chunks2 = result2.chunks.map((c) => ({ ...c, speaker: speaker2Name, source: 'system' }));

      // Merge arrays
      const mergedChunks = [...chunks1, ...chunks2];

      // Sort by start timestamp
      mergedChunks.sort((a, b) => {
        // Handle array timestamps [start, end]
        const startA = Array.isArray(a.timestamp) ? a.timestamp[0] : a.timestamp;
        const startB = Array.isArray(b.timestamp) ? b.timestamp[0] : b.timestamp;
        return startA - startB;
      });

      // Format JSON
      const finalJson = {
        speakers: { 1: speaker1Name, 2: speaker2Name },
        language: language,
        model: modelId,
        date: new Date().toISOString(),
        transcription: mergedChunks.map(chunk => ({
          speaker: chunk.speaker,
          start: Array.isArray(chunk.timestamp) ? chunk.timestamp[0] : chunk.timestamp,
          end: Array.isArray(chunk.timestamp) ? chunk.timestamp[1] : null,
          text: chunk.text.trim()
        }))
      };

      self.postMessage({ status: 'complete', result: JSON.stringify(finalJson, null, 2) });

    } catch (error) {
      self.postMessage({ status: 'error', message: `Erro na transcrição: ${error.message}` });
    }
  }
};
