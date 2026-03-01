const fs = require('fs');
let content = fs.readFileSync('app/locales/translations.ts', 'utf8');
content = content.replace(/  callTranscriber: {\n    title: "Call Transcriber",\n  },\n  callTranscriber: {\n    title: "Call Transcriber",\n  },\n/g, '  callTranscriber: {\n    title: "Call Transcriber",\n  },\n');
fs.writeFileSync('app/locales/translations.ts', content);
