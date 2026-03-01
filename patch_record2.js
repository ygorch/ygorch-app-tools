const fs = require('fs');
let content = fs.readFileSync('app/call-transcriber/record/page.tsx', 'utf8');

// Remove import of HF
content = content.replace(/import { env } from "@huggingface\/transformers";\n\n\/\/ Desativa cache local de Node e usa IndexedDB nativo do HF\nenv\.allowLocalModels = false;\nenv\.useBrowserCache = true;\n/, '');

// Replace handlePreDownload to use worker instead
const oldPreDownload = `  // Pre-download Model (Just to check/cache, using dummy instanciation or preload API if available,
  // but HF transformers loads on first pipeline call. We can create a dummy pipeline or just inform the user)
  const handlePreDownload = async () => {
    setModelStatus("downloading");
    try {
      // Lazy load pipeline
      const { pipeline } = await import("@huggingface/transformers");

      const transcriber = await pipeline("automatic-speech-recognition", modelId, {
        progress_callback: (info: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
          if (info.status === "progress") {
             // info.progress is a percentage (0-100)
             setDownloadProgress(Math.round(info.progress));
          }
        },
      });

      // Cleanup transcriber just to free memory, it's cached in IDB now
      await transcriber.dispose();
      setModelStatus("ready");
    } catch (err) {
      console.error("Error pre-downloading model:", err);
      setModelStatus("idle");
      alert("Falha ao baixar o modelo. Verifique sua conexão.");
    }
  };`;

const newPreDownload = `  const handlePreDownload = async () => {
    setModelStatus("downloading");

    // Uses the web worker to download and cache the model via WebGPU
    const worker = new Worker("/whisper-worker.js", { type: "module" });

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.status === "progress") {
         setDownloadProgress(Math.round(msg.progress));
      } else if (msg.status === "ready") {
         setModelStatus("ready");
         worker.terminate();
      } else if (msg.status === "error") {
         console.error(msg.message);
         setModelStatus("idle");
         alert("Falha ao baixar o modelo. Verifique sua conexão.");
         worker.terminate();
      }
    };

    worker.postMessage({ type: 'load', modelId });
  };`;

content = content.replace(oldPreDownload, newPreDownload);

fs.writeFileSync('app/call-transcriber/record/page.tsx', content);

// UPDATE [id]/page.tsx
let idContent = fs.readFileSync('app/call-transcriber/[id]/page.tsx', 'utf8');

idContent = idContent.replace(
    /const newWorker = new Worker\(new URL\('\.\.\/worker\.ts', import\.meta\.url\), { type: 'module' }\);/,
    `const newWorker = new Worker("/whisper-worker.js", { type: "module" });`
);

fs.writeFileSync('app/call-transcriber/[id]/page.tsx', idContent);

// Revert webpack config changes since they are not needed anymore
let nextConfig = fs.readFileSync('next.config.ts', 'utf8');
nextConfig = nextConfig.replace(/  webpack: \(config\) => {\n    \/\/ Ignore node-specific modules to prevent Vercel 250MB limit error due to onnxruntime-node\n    config\.resolve\.alias = {\n        \.\.\.config\.resolve\.alias,\n        "onnxruntime-node\$": false,\n    }\n    return config;\n  },\n/, '');
fs.writeFileSync('next.config.ts', nextConfig);
