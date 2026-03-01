const fs = require('fs');
let content = fs.readFileSync('app/call-transcriber/[id]/page.tsx', 'utf8');

// Add Pencil to imports
content = content.replace(
  /import { Mic, Download, Play, Square, Loader2, Cpu } from "lucide-react";/,
  `import { Mic, Download, Play, Square, Loader2, Cpu, Pencil, Check } from "lucide-react";`
);

// Add state for editing
content = content.replace(
  /const \[isPlaying, setIsPlaying\] = useState\(false\);/,
  `const [isPlaying, setIsPlaying] = useState(false);\n  const [isEditingTitle, setIsEditingTitle] = useState(false);\n  const [editTitleValue, setEditTitleValue] = useState("");`
);

// Add loadData logic to populate editTitleValue
content = content.replace(
  /setData\(record\);\n      setLoading\(false\);/,
  `setData(record);\n      setEditTitleValue(record.title || "");\n      setLoading(false);`
);

// Add save title function before getTextColorClass
content = content.replace(
  /const getTextColorClass = \(\) => preferences\?\.theme === "dark" \? "text-white" : "text-black";/,
  `const handleSaveTitle = async () => {\n    if (!data) return;\n    const updatedRecord = { ...data, title: editTitleValue.trim() || undefined };\n    await saveTranscription(updatedRecord);\n    setData(updatedRecord);\n    setIsEditingTitle(false);\n  };\n\n  const getTextColorClass = () => preferences?.theme === "dark" ? "text-white" : "text-black";`
);

// Replace Title UI
content = content.replace(
    /<h2 className="text-2xl font-serif font-medium mb-1">\n                {data.speaker1Name} <span className="text-orange-500 mx-2">vs<\/span> {data.speaker2Name}\n              <\/h2>/,
    `{isEditingTitle ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    placeholder={\`\${data.speaker1Name} vs \${data.speaker2Name}\`}
                    className={\`px-3 py-1 rounded-lg bg-transparent border \${getBorderClass()} focus:border-orange-500 focus:outline-none text-xl font-serif font-medium w-full max-w-xs\`}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); }}
                  />
                  <button onClick={handleSaveTitle} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h2 className="text-2xl font-serif font-medium mb-1 flex items-center gap-3 group">
                  {data.title ? data.title : <>{data.speaker1Name} <span className="text-orange-500 mx-0.5">vs</span> {data.speaker2Name}</>}
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-all"
                    title="Editar Título"
                  >
                    <Pencil className="w-4 h-4 opacity-50 hover:opacity-100" />
                  </button>
                </h2>
              )}`
);

fs.writeFileSync('app/call-transcriber/[id]/page.tsx', content);
