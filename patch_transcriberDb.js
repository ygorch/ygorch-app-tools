const fs = require('fs');
let content = fs.readFileSync('app/utils/transcriberDb.ts', 'utf8');
content = content.replace(
  /export interface CallTranscription {\n  id: string;\n  date: number;\n  speaker1Name: string;\n  speaker2Name: string;/,
  'export interface CallTranscription {\n  id: string;\n  title?: string;\n  date: number;\n  speaker1Name: string;\n  speaker2Name: string;'
);
fs.writeFileSync('app/utils/transcriberDb.ts', content);
