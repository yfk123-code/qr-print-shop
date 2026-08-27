'use client'

import {
  useRef,
  useState
} from 'react'

import { jsPDF } from 'jspdf'

function loadImage(src) {
  return new Promise(
    (resolve, reject) => {
      const img = new Image()

      img.onload =
        () => resolve(img)

      img.onerror = reject

      img.src = src
    }
  )
}

async function createPassportImage(
  src,
  zoom,
  x,
  y
) {
  const img =
    await loadImage(src)

  const canvas =
    document.createElement('canvas')

  // 35:45 ratio
  canvas.width = 700
  canvas.height = 900

  const ctx =
    canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  )

  const baseScale =
    Math.max(
      canvas.width / img.width,
      canvas.height / img.height
    )

  const finalScale =
    baseScale * zoom

  const drawW =
    img.width * finalScale

  const drawH =
    img.height * finalScale

  const extraX =
    Math.max(
      0,
      drawW - canvas.width
    )

  const extraY =
    Math.max(
      0,
      drawH - canvas.height
    )

  const dx =
    -(extraX * (x / 100))

  const dy =
    -(extraY * (y / 100))

  ctx.drawImage(
    img,
    dx,
    dy,
    drawW,
    drawH
  )

  return canvas.toDataURL(
    'image/jpeg',
    0.96
  )
}

export default function PassportPage() {
  const input =
    useRef(null)

  const [src, setSrc] =
    useState('')

  const [zoom, setZoom] =
    useState(1)

  const [x, setX] =
    useState(50)

  const [y, setY] =
    useState(50)

  const [qty, setQty] =
    useState(8)

  const [working, setWorking] =
    useState(false)

  const choose = file => {
    if (!file) return

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      alert(
        'Photo image select karein'
      )

      return
    }

    const reader =
      new FileReader()

    reader.onload = () => {
      setSrc(reader.result)
      setZoom(1)
      setX(50)
      setY(50)
    }

    reader.readAsDataURL(file)
  }

  const generate = async () => {
    if (!src) {
      alert(
        'Pehle photo upload karein'
      )

      return
    }

    setWorking(true)

    try {
      const finalPhoto =
        await createPassportImage(
          src,
          zoom,
          x,
          y
        )

      const pdf =
        new jsPDF({
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        })

      const photoW = 35
      const photoH = 45

      const gapX = 5
      const gapY = 5

      const cols = 4

      const rows =
        Math.ceil(qty / cols)

      const totalW =
        cols * photoW +
        (cols - 1) * gapX

      const totalH =
        rows * photoH +
        Math.max(
          0,
          rows - 1
        ) * gapY

      const startX =
        (210 - totalW) / 2

      const startY =
        Math.max(
          12,
          (297 - totalH) / 2
        )

      for (
        let i = 0;
        i < qty;
        i++
      ) {
        const col =
          i % cols

        const row =
          Math.floor(
            i / cols
          )

        const px =
          startX +
          col *
            (photoW + gapX)

        const py =
          startY +
          row *
            (photoH + gapY)

        pdf.addImage(
          finalPhoto,
          'JPEG',
          px,
          py,
          photoW,
          photoH
        )

        // light cutting border
        pdf.setDrawColor(
          210,
          210,
          210
        )

        pdf.setLineWidth(0.15)

        pdf.rect(
          px,
          py,
          photoW,
          photoH
        )
      }

      pdf.save(
        'Passport_Photos_A4.pdf'
      )

      alert(
        '✅ Passport photo PDF ready!\\n\\n' +
        qty +
        ' photos, 35×45 mm.\\n\\n' +
        'Ab downloaded PDF ko Document Print me upload karein.'
      )

      window.location.href =
        '/print'

    } catch (e) {
      console.error(e)

      alert(
        'Error: ' +
        e.message
      )
    } finally {
      setWorking(false)
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <a
          href="/print"
          style={styles.back}
        >
          ← Back
        </a>

        <div>
          <h1 style={styles.heading}>
            📸 Passport Photo Maker
          </h1>

          <p style={styles.sub}>
            Upload ya camera se photo lein,
            crop adjust karein aur A4 sheet banayein.
          </p>
        </div>
      </div>

      <div style={styles.workspace}>
        <section style={styles.card}>
          {!src ? (
            <button
              style={styles.upload}
              onClick={() =>
                input.current?.click()
              }
            >
              <span style={{
                fontSize: 60
              }}>
                🤳
              </span>

              <strong style={{
                fontSize: 18
              }}>
                Upload / Take Photo
              </strong>

              <small style={{
                marginTop: 7,
                color: '#747d90'
              }}>
                Camera ya Gallery
              </small>
            </button>
          ) : (
            <>
              <div
                style={{
                  ...styles.preview,

                  backgroundImage:
                    `url("${src}")`,

                  backgroundSize:
                    `${zoom * 100}%`,

                  backgroundPosition:
                    `${x}% ${y}%`
                }}
              />

              <div style={styles.controls}>
                <label style={styles.control}>
                  <span>
                    🔍 Zoom
                  </span>

                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.02"
                    value={zoom}
                    onChange={
                      e =>
                        setZoom(
                          Number(
                            e.target.value
                          )
                        )
                    }
                  />
                </label>

                <label style={styles.control}>
                  <span>
                    ↔ Left / Right
                  </span>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={x}
                    onChange={
                      e =>
                        setX(
                          Number(
                            e.target.value
                          )
                        )
                    }
                  />
                </label>

                <label style={styles.control}>
                  <span>
                    ↕ Up / Down
                  </span>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={y}
                    onChange={
                      e =>
                        setY(
                          Number(
                            e.target.value
                          )
                        )
                    }
                  />
                </label>
              </div>

              <button
                style={styles.change}
                onClick={() =>
                  input.current?.click()
                }
              >
                🔄 Change Photo
              </button>
            </>
          )}

          <input
            ref={input}
            hidden
            type="file"
            accept="image/*"
            capture="user"
            onChange={
              e =>
                choose(
                  e.target.files?.[0]
                )
            }
          />
        </section>

        <section style={styles.settings}>
          <h2>
            Print Settings
          </h2>

          <div style={styles.info}>
            Passport Size
            <strong>
              35 × 45 mm
            </strong>
          </div>

          <label style={styles.settingLabel}>
            Photos on A4

            <select
              style={styles.select}
              value={qty}
              onChange={
                e =>
                  setQty(
                    Number(
                      e.target.value
                    )
                  )
              }
            >
              <option value="4">
                4 Photos
              </option>

              <option value="8">
                8 Photos
              </option>

              <option value="12">
                12 Photos
              </option>

              <option value="16">
                16 Photos
              </option>

              <option value="20">
                20 Photos
              </option>
            </select>
          </label>

          <div style={styles.note}>
            ℹ️ Photo crop 35×45 ratio me
            automatically fit hogi.
          </div>

          <div style={styles.warning}>
            Background removal abhi active nahi hai.
            Original background hi rahega.
          </div>
        </section>
      </div>

      <button
        style={styles.generate}
        disabled={working}
        onClick={generate}
      >
        {working
          ? '⏳ Creating A4 PDF...'
          : `🖨️ Create A4 Sheet - ${qty} Photos`}
      </button>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background:
      'linear-gradient(145deg,#eef2ff,#f6eafa)',
    padding: 20,
    fontFamily:
      'Segoe UI, sans-serif',
    color: '#172033'
  },

  header: {
    maxWidth: 950,
    margin: '0 auto 20px',
    display: 'flex',
    gap: 18,
    alignItems: 'center'
  },

  back: {
    textDecoration: 'none',
    padding: '10px 14px',
    background: 'white',
    color: '#5146d8',
    borderRadius: 12,
    fontWeight: 700
  },

  heading: {
    margin: 0,
    fontSize: 28
  },

  sub: {
    margin: '5px 0 0',
    color: '#717a8d'
  },

  workspace: {
    maxWidth: 950,
    margin: 'auto',
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit,minmax(300px,1fr))',
    gap: 18
  },

  card: {
    background: 'white',
    borderRadius: 22,
    padding: 20,
    boxShadow:
      '0 14px 35px rgba(40,45,80,.10)'
  },

  upload: {
    width: '100%',
    minHeight: 450,
    border:
      '3px dashed #8177e7',
    background: '#f8f7ff',
    borderRadius: 18,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },

  preview: {
    width: 'min(100%,350px)',
    aspectRatio: '35 / 45',
    margin: '0 auto',
    border:
      '4px solid #5146d8',
    borderRadius: 15,
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#eee'
  },

  controls: {
    display: 'grid',
    gap: 11,
    marginTop: 17
  },

  control: {
    display: 'grid',
    gap: 5,
    fontSize: 13,
    color: '#5e6678'
  },

  change: {
    width: '100%',
    marginTop: 15,
    padding: 12,
    border: 0,
    background: '#eceaff',
    color: '#5146d8',
    borderRadius: 12,
    fontWeight: 800,
    cursor: 'pointer'
  },

  settings: {
    background: 'white',
    padding: 24,
    borderRadius: 22,
    boxShadow:
      '0 14px 35px rgba(40,45,80,.10)'
  },

  info: {
    display: 'flex',
    justifyContent:
      'space-between',
    padding: 15,
    background: '#f5f4ff',
    borderRadius: 13
  },

  settingLabel: {
    display: 'grid',
    gap: 8,
    marginTop: 20,
    fontWeight: 700
  },

  select: {
    padding: 14,
    border:
      '2px solid #e0e1e8',
    borderRadius: 12,
    background: 'white'
  },

  note: {
    marginTop: 20,
    background: '#edf8ff',
    padding: 14,
    borderRadius: 12,
    color: '#286585'
  },

  warning: {
    marginTop: 12,
    background: '#fff4d9',
    padding: 14,
    borderRadius: 12,
    color: '#765b14'
  },

  generate: {
    display: 'block',
    width: 'min(950px,100%)',
    margin: '20px auto',
    padding: 18,
    border: 0,
    borderRadius: 16,
    background:
      'linear-gradient(135deg,#d9468c,#7c3aed)',
    color: 'white',
    fontSize: 18,
    fontWeight: 800,
    cursor: 'pointer'
  }
}
