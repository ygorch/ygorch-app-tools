const fs = require('fs');
let content = fs.readFileSync('app/call-transcriber/page.tsx', 'utf8');

content = content.replace(
    /<h3 className="font-medium text-lg mb-1">\n                          {t.speaker1Name} <span className="text-orange-500 mx-2">vs<\/span> {t.speaker2Name}\n                        <\/h3>/,
    `<h3 className="font-medium text-lg mb-1">
                          {t.title ? t.title : <>{t.speaker1Name} <span className="text-orange-500 mx-2">vs</span> {t.speaker2Name}</>}
                        </h3>`
);

fs.writeFileSync('app/call-transcriber/page.tsx', content);
