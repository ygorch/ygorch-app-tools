const fs = require('fs');
let content = fs.readFileSync('app/call-transcriber/[id]/page.tsx', 'utf8');

// Update import to use the new function
content = content.replace(
    /import { processAudioFile } from "\.\.\/\.\.\/utils\/audioProcessing";/,
    `import { processAndSyncAudioFiles } from "../../utils/audioProcessing";`
);

// Update loadData function calls
content = content.replace(
    /const { wavBlob: wav1, audioDataForModel: data1 } = await processAudioFile\(record\.audioBlob1\);\n\s+const { wavBlob: wav2, audioDataForModel: data2 } = await processAudioFile\(record\.audioBlob2\);/,
    `const { wavBlob1, wavBlob2, audioDataForModel1, audioDataForModel2 } = await processAndSyncAudioFiles(record.audioBlob1, record.audioBlob2);`
);

// Replace variable assignments
content = content.replace(/setWavMic\(wav1\);/, `setWavMic(wavBlob1);`);
content = content.replace(/setWavSys\(wav2\);/, `setWavSys(wavBlob2);`);
content = content.replace(/startTranscriptionWorker\(data1, data2, record\);/, `startTranscriptionWorker(audioDataForModel1, audioDataForModel2, record);`);

fs.writeFileSync('app/call-transcriber/[id]/page.tsx', content);
