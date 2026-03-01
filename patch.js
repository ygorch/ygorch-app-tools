const fs = require('fs');
const path = './app/utils/apps.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  /}\s*,\s*\];/,
  `},
  {
    id: "call-transcriber",
    translationKey: "callTranscriber",
    icon: Mic,
    color: "bg-white/5 backdrop-blur-xl border border-white/10 group-hover:bg-white/10 group-hover:border-white/20",
    href: "/call-transcriber",
    notification: 0,
  },
];`
);
fs.writeFileSync(path, content);
