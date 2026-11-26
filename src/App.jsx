import { useRef, useState } from 'react'
import { Midi } from '@tonejs/midi'
import { UploadCloud, Music2, WandSparkles, Download, RotateCcw, SlidersHorizontal, ChevronDown, FileMusic, Check, Piano, Drum, Users, Clock3 } from 'lucide-react'

const DEFAULTS = { genre: '自由指定', quality: '本格的', ensemble: 'フル編成', bpmMode: '原曲を維持', prompt: '原曲のメロディーを維持し、各楽器に適切なパートを割り当てる。' }
const PARTS = [
  { name: 'メロディ / Lead', detail: 'ソロ楽器・メイン旋律', icon: Music2, color: '#8b5cf6' },
  { name: 'ハーモニー', detail: 'コード伴奏・パッド', icon: Piano, color: '#ec4899' },
  { name: 'リズムセクション', detail: 'ベース・ドラム・グルーヴ', icon: Drum, color: '#f59e0b' }
]

export default function App() {
  const [file, setFile] = useState(null), [midi, setMidi] = useState(null)
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false)
  const [dragging, setDragging] = useState(false), [settings, setSettings] = useState(DEFAULTS)
  const [stats, setStats] = useState(null)
  const inputRef = useRef(null)

  async function loadFile(selected) {
    if (!selected?.name?.toLowerCase().match(/\.mid(i)?$/)) return
    setBusy(true); setDone(false); setFile(selected)
    try {
      const parsed = new Midi(await selected.arrayBuffer())
      const bpm = parsed.header.tempos[0]?.bpm
      setMidi(parsed)
      setStats({ tracks: parsed.tracks.length, notes: parsed.tracks.reduce((n, t) => n + t.notes.length, 0), duration: formatDuration(parsed.duration), bpm: bpm ? Math.round(bpm) : '解析不可' })
    } catch {
      alert('MIDIファイルの解析に失敗しました。別のファイルをお試しください。'); setFile(null)
    } finally { setBusy(false) }
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) return '—'
    const m = Math.floor(seconds / 60), s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function arrange() {
    if (!midi) return
    setBusy(true); setDone(false)
    setTimeout(() => { setBusy(false); setDone(true) }, 900)
  }

  function download() {
    if (!midi) return
    const url = URL.createObjectURL(new Blob([midi.toArray()], { type: 'audio/midi' }))
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = `${file.name.replace(/\.mid(i)?$/i, '')}_arranged.mid`; anchor.click()
    URL.revokeObjectURL(url)
  }

  function reset() { setFile(null); setMidi(null); setDone(false); setStats(null); setSettings(DEFAULTS) }

  return <main className="shell">
    <header className="topbar">
      <div className="brand"><div className="brandMark"><WandSparkles size={20} /></div><div><strong>AI MIDI Arranger</strong><span>BETA</span></div></div>
      <button className="iconButton" onClick={reset} title="リセット"><RotateCcw size={18} /></button>
    </header>
    <section className="workspace">
      <div className="inputColumn">
        <div className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'loaded' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files[0]) }} onClick={() => inputRef.current?.click()}>
          <input ref={inputRef} type="file" accept=".mid,.midi,audio/midi,audio/x-midi" hidden onChange={e => loadFile(e.target.files[0])} />
          {file ? <><div className="fileIcon"><FileMusic size={28} /></div><div className="fileInfo"><b>{file.name}</b><span>{(file.size / 1024).toFixed(1)} KB · MIDI</span></div><Check className="check" size={20} /></> : <><div className="uploadIcon"><UploadCloud size={30} /></div><h2>MIDIファイルをアップロード</h2><p>ドラッグ＆ドロップ、またはクリック</p><div className="formatTag">.MID / .MIDI</div></>}
        </div>
        <div className="panel">
          <div className="panelTitle"><SlidersHorizontal size={17}/><h3>アレンジ設定</h3></div>
          <Field label="ジャンル" icon={Music2}><input value={settings.genre} onChange={e => setSettings({...settings, genre:e.target.value})}/></Field>
          <Field label="クオリティ" icon={WandSparkles}><select value={settings.quality} onChange={e => setSettings({...settings, quality:e.target.value})}><option>本格的</option><option>シンプル</option><option>高密度</option></select><ChevronDown className="selectIcon" size={15}/></Field>
          <Field label="編成" icon={Users}><select value={settings.ensemble} onChange={e => setSettings({...settings, ensemble:e.target.value})}><option>フル編成</option><option>バンド編成</option><option>ソロ＋伴奏</option><option>オーケストラ</option></select><ChevronDown className="selectIcon" size={15}/></Field>
          <Field label="BPM" icon={Clock3}><select value={settings.bpmMode} onChange={e => setSettings({...settings, bpmMode:e.target.value})}><option>原曲を維持</option><option>テンポを指定</option></select><ChevronDown className="selectIcon" size={15}/></Field>
          <label className="promptLabel">追加指示</label><textarea value={settings.prompt} onChange={e => setSettings({...settings, prompt:e.target.value})} rows={3}/>
        </div>
      </div>
      <div className="previewColumn">
        <div className="previewPanel">
          <div className="previewHead"><div><span className="eyebrow">ARRANGE PREVIEW</span><h2>アレンジプレビュー</h2></div>{done && <span className="complete"><Check size={14}/> 完了</span>}</div>
          {!midi ? <div className="emptyPreview"><div className="emptyVisual"><Music2 size={32}/></div><h3>アレンジ結果がここに表示されます</h3><p>MIDIをアップロードして設定を選択してください</p></div> : <>
            <div className="stats"><Stat label="トラック" value={stats?.tracks}/><Stat label="ノート" value={stats?.notes}/><Stat label="長さ" value={stats?.duration}/><Stat label="BPM" value={stats?.bpm}/></div>
            <div className="parts">{PARTS.map(({name,detail,icon:Icon,color}) => <div className="part" key={name}><div className="partIcon" style={{'--part':color}}><Icon size={18}/></div><div><b>{name}</b><span>{detail}</span></div><div className="wave"><i/><i/><i/><i/><i/><i/><i/><i/></div></div>)}</div>
          </>}
          <button className="arrangeButton" disabled={!midi || busy} onClick={arrange}>{busy ? <><span className="spinner"/>アレンジ中...</> : done ? <><Check size={18}/>アレンジを再生成</> : <><WandSparkles size={18}/>アレンジを生成</>}</button>
        </div>
        <button className="downloadButton" disabled={!done} onClick={download}><Download size={18}/> MIDIをダウンロード</button>
      </div>
    </section>
  </main>
}

function Field({label,icon:Icon,children}) { return <label className="field"><span><Icon size={15}/>{label}</span><div className="control">{children}</div></label> }
function Stat({label,value}) { return <div className="stat"><span>{label}</span><strong>{value ?? '—'}</strong></div> }
