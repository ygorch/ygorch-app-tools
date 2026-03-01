const fs = require('fs');
let content = fs.readFileSync('app/call-transcriber/[id]/page.tsx', 'utf8');

// Insert audio elements visible
const oldAudioElements = `{micUrl && <audio ref={micAudioRef} src={micUrl} onEnded={() => setIsPlaying(false)} />}\n        {sysUrl && <audio ref={sysAudioRef} src={sysUrl} />}`;

const newAudioElements = `{/* Individual Players */}
        <div className={\`p-6 rounded-3xl border backdrop-blur-md \${getBgClass()} \${getBorderClass()} grid grid-cols-1 md:grid-cols-2 gap-6\`}>
          {wavMic && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Mic className="w-4 h-4 text-orange-500" />
                Áudio: {data.speaker1Name}
              </h3>
              <audio controls className="w-full h-10 outline-none rounded-xl bg-black/20" src={micUrl} />
            </div>
          )}
          {wavSys && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-orange-500" />
                Áudio: {data.speaker2Name}
              </h3>
              <audio controls className="w-full h-10 outline-none rounded-xl bg-black/20" src={sysUrl} />
            </div>
          )}
        </div>

        {/* Hidden Master Audio Elements for Sync Playback */}
        {micUrl && <audio ref={micAudioRef} src={micUrl} onEnded={() => setIsPlaying(false)} />}
        {sysUrl && <audio ref={sysAudioRef} src={sysUrl} />}`;

content = content.replace(oldAudioElements, newAudioElements);

fs.writeFileSync('app/call-transcriber/[id]/page.tsx', content);
