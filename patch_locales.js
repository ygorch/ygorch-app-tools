const fs = require('fs');
let content = fs.readFileSync('app/locales/translations.ts', 'utf8');

// Insert english
content = content.replace(
  /  pasteBin: {\n    title: "Paste Bin",/,
  `  callTranscriber: {
    title: "Call Transcriber",
  },
  pasteBin: {
    title: "Paste Bin",`
);

// Insert portuguese
content = content.replace(
  /  pasteBin: {\n    title: "Paste Bin",/g,
  (match, offset, string) => {
     if (offset > 1500 && offset < 4000) { // Na PT section
        return `  callTranscriber: {\n    title: "Call Transcriber",\n  },\n${match}`;
     }
     return match;
  }
);

// Insert spanish
content = content.replace(
  /  pasteBin: {\n    title: "Paste Bin",/g,
  (match, offset, string) => {
     if (offset > 4000) { // Na ES section
        return `  callTranscriber: {\n    title: "Call Transcriber",\n  },\n${match}`;
     }
     return match;
  }
);

fs.writeFileSync('app/locales/translations.ts', content);
