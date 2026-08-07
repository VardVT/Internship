import React, { useMemo, useState } from 'react'

const HELP_URL =
  'https://drive.google.com/file/d/14NNDzXSCG63m1yQZb51tZhrZfd5k8KPf/view?usp=sharing'

const DEFAULTS = {
  px: '0', py: '0', pz: '0',
  dx: '0', dy: '0', dz: '0',
  r1: '150', r2: '150', r3: '150', r4: '150',
  axis: 'Z',
}

// Same tolerant number parser as the original desktop tool:
// accepts "1234.5", "1234,5", and "1.234,5" style input.
function parseVal(text, fallback = 0) {
  const raw = (text ?? '').trim()
  if (!raw) return fallback
  let normalized = raw
  if (raw.includes('.') && raw.includes(',')) {
    normalized = raw.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = raw.replace(',', '.')
  }
  const val = parseFloat(normalized)
  return Number.isFinite(val) ? val : fallback
}

// Ports generate_mac() from the PyQt tool 1:1 - same macro grammar/output.
function generateMac(px, py, pz, dx, dy, dz, r1, r2, r3, r4, axis) {
  let oriStr = 'ORI Y is Y and Z is Z'
  if (axis === 'X') oriStr = 'ORI Y is Y and Z is X'
  else if (axis === 'Y') oriStr = 'ORI Y is -X and Z is Y'
  else if (axis === 'Z') oriStr = 'ORI Y is Y and Z is Z'

  return `NEW EQUIPMENT
USRCOG ( X ( 0 ) Y ( 0 ) Z ( 0 ) )
USRWCO ( X ( 0 ) Y ( 0 ) Z ( 0 ) )
POS X ${px}mm Y ${py}mm Z ${pz}mm
${oriStr}
BUIL false
DSCO unset
PTSP unset
INSC unset

NEW EXTRUSION
ORI Y is -Y and Z is Z
LEVE 0 2
HEIG ${dz}mm

NEW LOOP

NEW VERTEX
FRAD ${r1}mm

END
NEW VERTEX
POS X 0mm Y ${dy}mm Z 0mm
FRAD ${r2}mm

END
NEW VERTEX
POS X ${dx}mm Y ${dy}mm Z 0mm
FRAD ${r3}mm

END
NEW VERTEX
POS X ${dx}mm Y 0mm Z 0mm
FRAD ${r4}mm

END
END
END
END`
}

// Isometric projection, same kY factor as the original QPainter canvas.
function projectISO(x, y, z, cx, cy) {
  const kY = 0.55
  return { x: cx + x + y * kY, y: cy - z - y * kY }
}

const VB_W = 720
const VB_H = 340

function Viewport({ L, W, H, axis }) {
  const isEmpty = L === 0 && W === 0 && H === 0

  const { wireframe, axisGizmo } = useMemo(() => {
    // Axis gizmo (bottom-left), matches original fixed anchor.
    const x0 = 46
    const y0 = VB_H * 0.82
    const gizmo = { x0, y0 }

    if (isEmpty) return { wireframe: null, axisGizmo: gizmo }

    const maxDim = Math.max(L, W, H, 100)
    const scale = 150 / maxDim

    let d1, d2, d3, lbl1, lbl2, lbl3
    if (axis === 'X') {
      d1 = H * scale; d2 = W * scale; d3 = L * scale
      lbl1 = `H = ${H}`; lbl2 = `W = ${W}`; lbl3 = `L = ${L}`
    } else if (axis === 'Y') {
      d1 = L * scale; d2 = H * scale; d3 = W * scale
      lbl1 = `L = ${L}`; lbl2 = `H = ${H}`; lbl3 = `W = ${W}`
    } else {
      d1 = L * scale; d2 = W * scale; d3 = H * scale
      lbl1 = `L = ${L}`; lbl2 = `W = ${W}`; lbl3 = `H = ${H}`
    }

    const cx = VB_W / 2 + 30
    const cy = VB_H / 2 + 30
    const ox = cx - d1 / 2
    const oy = cy + d3 / 2

    const b0 = projectISO(0, 0, 0, ox, oy)
    const b1 = projectISO(d1, 0, 0, ox, oy)
    const b2 = projectISO(d1, d2, 0, ox, oy)
    const b3 = projectISO(0, d2, 0, ox, oy)
    const t0 = projectISO(0, 0, d3, ox, oy)
    const t1 = projectISO(d1, 0, d3, ox, oy)
    const t2 = projectISO(d1, d2, d3, ox, oy)
    const t3 = projectISO(0, d2, d3, ox, oy)

    // Dimension leader anchors, pushed outside the silhouette for legibility.
    const lead1a = projectISO(0, -26, 0, ox, oy)
    const lead1b = projectISO(d1, -26, 0, ox, oy)
    const lead2a = projectISO(d1 + 26, 0, d3, ox, oy)
    const lead2b = projectISO(d1 + 26, d2, d3, ox, oy)
    const lead3a = projectISO(-26, 0, 0, ox, oy)
    const lead3b = projectISO(-26, 0, d3, ox, oy)

    const pt = (p) => `${p.x},${p.y}`

    return {
      wireframe: {
        bottom: [b0, b1, b2, b3].map(pt).join(' '),
        top: [t0, t1, t2, t3].map(pt).join(' '),
        verticals: [
          [b0, t0], [b1, t1], [b2, t2], [b3, t3],
        ],
        leaders: [
          { from: projectISO(0, 0, 0, ox, oy), to: lead1a },
          { from: projectISO(d1, 0, 0, ox, oy), to: lead1b },
          { from: lead1a, to: lead1b, isDim: true, label: lbl1, mid: projectISO(d1 / 2, -26, 0, ox, oy), color: 'var(--axis-x)' },

          { from: projectISO(d1, 0, d3, ox, oy), to: lead2a },
          { from: projectISO(d1, d2, d3, ox, oy), to: lead2b },
          { from: lead2a, to: lead2b, isDim: true, label: lbl2, mid: projectISO(d1 + 26, d2 / 2, d3, ox, oy), color: 'var(--axis-y)' },

          { from: projectISO(0, 0, 0, ox, oy), to: lead3a },
          { from: projectISO(0, 0, d3, ox, oy), to: lead3b },
          { from: lead3a, to: lead3b, isDim: true, label: lbl3, mid: projectISO(-26, 0, d3 / 2, ox, oy), color: 'var(--axis-z)' },
        ],
      },
      axisGizmo: gizmo,
    }
  }, [L, W, H, axis, isEmpty])

  return (
    <div className="viewport">
      <span className="viewport-label">Isometric preview</span>
      {isEmpty && (
        <span className="viewport-empty">
          Enter Length / Width / Height to preview the opening
        </span>
      )}
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
        {/* Axis gizmo */}
        <g strokeWidth="2" fontFamily="IBM Plex Mono, monospace" fontSize="12" fontWeight="700">
          <line x1={axisGizmo.x0} y1={axisGizmo.y0} x2={axisGizmo.x0 + 36} y2={axisGizmo.y0} stroke="var(--axis-x)" />
          <text x={axisGizmo.x0 + 42} y={axisGizmo.y0 + 4} fill="var(--axis-x)">X</text>

          <line x1={axisGizmo.x0} y1={axisGizmo.y0} x2={axisGizmo.x0 + 26} y2={axisGizmo.y0 - 26} stroke="var(--axis-y)" />
          <text x={axisGizmo.x0 + 29} y={axisGizmo.y0 - 30} fill="var(--axis-y)">Y</text>

          <line x1={axisGizmo.x0} y1={axisGizmo.y0} x2={axisGizmo.x0} y2={axisGizmo.y0 - 36} stroke="var(--axis-z)" />
          <text x={axisGizmo.x0 - 4} y={axisGizmo.y0 - 42} fill="var(--axis-z)">Z</text>
        </g>

        {wireframe && (
          <g>
            <polygon
              className="marching"
              points={wireframe.bottom}
              fill="var(--wire-fill)"
              stroke="var(--wire)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <polygon
              className="marching"
              points={wireframe.top}
              fill="var(--wire-fill)"
              stroke="var(--wire)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            {wireframe.verticals.map(([a, b], i) => (
              <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--wire)" strokeWidth="1.5" strokeOpacity="0.7" />
            ))}

            {/* Dimension leader lines, extended outside the box like a real drawing callout */}
            {wireframe.leaders.map((ld, i) =>
              ld.isDim ? (
                <line
                  key={i}
                  x1={ld.from.x} y1={ld.from.y} x2={ld.to.x} y2={ld.to.y}
                  stroke={ld.color} strokeWidth="1.5"
                />
              ) : (
                <line
                  key={i}
                  x1={ld.from.x} y1={ld.from.y} x2={ld.to.x} y2={ld.to.y}
                  stroke="var(--line-dim)" strokeWidth="1" strokeDasharray="2 3"
                />
              )
            )}

            {wireframe.leaders.filter((l) => l.isDim).map((l, i) => {
              const w = l.label.length * 7.6 + 14
              return (
                <g key={`lbl-${i}`}>
                  <rect
                    x={l.mid.x - w / 2} y={l.mid.y - 12}
                    width={w} height={20} rx={2}
                    fill="var(--paper-3)" stroke={l.color} strokeOpacity="0.55" strokeWidth="1"
                  />
                  <text
                    x={l.mid.x} y={l.mid.y + 3}
                    textAnchor="middle"
                    fill={l.color}
                    fontFamily="IBM Plex Mono, monospace"
                    fontSize="13"
                    fontWeight="700"
                  >
                    {l.label}
                  </text>
                </g>
              )
            })}
          </g>
        )}
      </svg>
    </div>
  )
}

function NumField({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default function App() {
  const [form, setForm] = useState(DEFAULTS)
  const [message, setMessage] = useState(null)

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))

  const L = parseVal(form.dx)
  const W = parseVal(form.dy)
  const H = parseVal(form.dz)

  const handleReset = () => {
    setForm(DEFAULTS)
    setMessage(null)
  }

  const handleHelp = () => {
    window.open(HELP_URL, '_blank', 'noopener,noreferrer')
  }

  const handleExport = () => {
    try {
      const px = parseVal(form.px)
      const py = parseVal(form.py)
      const pz = parseVal(form.pz)
      const dx = parseVal(form.dx)
      const dy = parseVal(form.dy)
      const dz = parseVal(form.dz)
      const r1 = parseVal(form.r1, 150)
      const r2 = parseVal(form.r2, 150)
      const r3 = parseVal(form.r3, 150)
      const r4 = parseVal(form.r4, 150)

      const content = generateMac(px, py, pz, dx, dy, dz, r1, r2, r3, r4, form.axis)

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '3D Opening.mac'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setMessage({ type: 'ok', text: 'Đã tạo file "3D Opening.mac" — kiểm tra thư mục Downloads của bạn.' })
    } catch (err) {
      setMessage({ type: 'error', text: String(err) })
    }
  }

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  return (
    <div className="app-shell">
      <span className="crop crop-tl" />
      <span className="crop crop-tr" />
      <span className="crop crop-bl" />
      <span className="crop crop-br" />

      <header className="app-header">
        <div className="brand">
          <span className="eyebrow">Macro Generator · SCM Maestro Format</span>
          <h1>Create 3D&nbsp;Opening</h1>
        </div>
        <span className="stamp">Web Edition<br />Client-side · No server</span>
      </header>

      <Viewport L={L} W={W} H={H} axis={form.axis} />

      <div className="form-area">
        <div className="row">
          <fieldset className="group">
            <legend>Position</legend>
            <NumField label="X [mm]" value={form.px} onChange={set('px')} />
            <NumField label="Y [mm]" value={form.py} onChange={set('py')} />
            <NumField label="Z [mm]" value={form.pz} onChange={set('pz')} />
          </fieldset>

          <fieldset className="group">
            <legend>Dimension</legend>
            <NumField label="Length [mm]" value={form.dx} onChange={set('dx')} />
            <NumField label="Width [mm]" value={form.dy} onChange={set('dy')} />
            <NumField label="Height [mm]" value={form.dz} onChange={set('dz')} />
          </fieldset>
        </div>

        <fieldset className="group">
          <legend>Corner radius (mm)</legend>
          <div className="radius-grid">
            {['r1', 'r2', 'r3', 'r4'].map((key, i) => (
              <div className="radius-field" key={key}>
                <label>R{i + 1}</label>
                <input type="text" inputMode="decimal" value={form[key]} onChange={(e) => set(key)(e.target.value)} />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="group">
          <legend>Orientation</legend>
          <div className="orientation-row">
            <div className="seg">
              {['X', 'Y', 'Z'].map((axis) => (
                <button
                  key={axis}
                  type="button"
                  data-axis={axis}
                  className={form.axis === axis ? 'active' : ''}
                  onClick={() => set('axis')(axis)}
                >
                  {axis}
                </button>
              ))}
            </div>
            <span className="seg-hint">Trục đùn (extrusion axis) của biên dạng</span>
          </div>
        </fieldset>

        <div className="btn-row">
          <button className="btn btn-ok" onClick={handleExport}>OK (Export MAC)</button>
          <button className="btn btn-help" onClick={handleHelp}>Help</button>
          <button className="btn btn-reset" onClick={handleReset}>Reset</button>
        </div>

        {message && (
          <div className={`toast ${message.type === 'error' ? 'error' : ''}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="title-block">
        <div className="tb-cell">
          <span className="tb-key">Drawn</span>
          <span className="tb-val">{today}</span>
        </div>
        <div className="tb-cell">
          <span className="tb-key">Scale</span>
          <span className="tb-val">NTS</span>
        </div>
        <div className="tb-cell">
          <span className="tb-key">Axis</span>
          <span className="tb-val" style={{ color: `var(--axis-${form.axis.toLowerCase()})` }}>{form.axis}</span>
        </div>
        <div className="tb-cell">
          <span className="tb-key">Sheet</span>
          <span className="tb-val">1 / 1</span>
        </div>
        <div className="tb-cell">
          <span className="tb-key">Rev</span>
          <span className="tb-val">A</span>
        </div>
      </div>

      <p className="footnote">
        Ported from the PyQt6 desktop tool — runs entirely in your browser, no data leaves your device.
      </p>
    </div>
  )
}
