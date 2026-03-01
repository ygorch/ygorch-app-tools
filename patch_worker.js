const fs = require('fs');
let content = fs.readFileSync('public/whisper-worker.js', 'utf8');

const replacement = `
      const config = {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: 'word',
        ...(language !== 'auto' ? { language } : {}),
      };

      // 1. Transcribe audio 1 (Mic)
      const result1 = await transcriber(audioData1, config);

      self.postMessage({ status: 'transcribing', message: \`Transcrevendo áudio de \${speaker2Name}...\` });

      // 2. Transcribe audio 2 (System)
      const result2 = await transcriber(audioData2, config);

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
`;

// Replace from config definition to end of transcribe block
content = content.replace(/      const config = {[\s\S]*?      const finalJson = {[\s\S]*?      };/, replacement);

fs.writeFileSync('public/whisper-worker.js', content);
