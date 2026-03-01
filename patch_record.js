const fs = require('fs');
let content = fs.readFileSync('app/call-transcriber/record/page.tsx', 'utf8');
content = content.replace(
  /progress_callback: \(info: eslint-disable-next-line @typescript-eslint\/no-explicit-any \n any\) => {/,
  'progress_callback: (info: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {'
);
fs.writeFileSync('app/call-transcriber/record/page.tsx', content);
