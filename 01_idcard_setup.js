const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = process.cwd();

console.log("\n=== AADHAAR / PAN MODULE SETUP ===\n");

// Backup
const backup = path.join(ROOT, "_backup_idcard");

fs.mkdirSync(backup, { recursive: true });

if (fs.existsSync(path.join(ROOT, "app"))) {
  fs.cpSync(
    path.join(ROOT, "app"),
    path.join(backup, "app"),
    { recursive: true }
  );
}

console.log("Backup created:", backup);

// Folder
const dir = path.join(ROOT, "app", "id-card");

fs.mkdirSync(dir, { recursive: true });

// Page
const page = String.raw`'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { jsPDF } from 'jspdf'

function UploadBox({ title, value, setValue }) {
  const readFile = (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Image select karein')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setValue(reader.result)
    }

    reader.readAsDataURL(file)
  }

  return (
    <div style={styles.uploadCard}>
      <h2 style={styles.cardTitle}>
        {title}
      </h2>

      {value ? (
        <>
          <div style={styles.cropWindow}>
            <img
              src={value}
              alt={title}
              style={styles.cropImage}
            />
          </div>

          <label style={styles.changeButton}>
            Change Photo

            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) =>
                readFile(e.target.files?.[0])
              }
            />
          </label>
        </>
      ) : (
        <label style={styles.uploadButton}>
          <div style={{ fontSize: 50 }}>
            📷
          </div>

          <strong>
            Upload / Camera
          </strong>

          <span style={styles.help}>
            Yahan tap karein
          </span>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) =>
              readFile(e.target.files?.[0])
            }
          />
        </label>
      )}
    </div>
  )
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function cardCrop(src) {
  const img = await loadImage(src)

  const ratio = 85.6 / 53.98

  let sourceX = 0
  let sourceY = 0
  let sourceW = img.width
  let sourceH = img.height

  const currentRatio =
    img.width / img.height

  if (currentRatio > ratio) {
    sourceW =
      img.height * ratio

    sourceX =
      (img.width - sourceW) / 2
  } else {
    sourceH =
      img.width / ratio

    sourceY =
      (img.height - sourceH) / 2
  }

  const canvas =
    document.createElement('canvas')

  canvas.width = 1200
  canvas.height =
    Math.round(1200 / ratio)

  const ctx =
    canvas.getContext('2d')

  ctx.fillStyle = 'white'

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  )

  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return canvas.toDataURL(
    'image/jpeg',
    0.95
  )
}

export default function IDCardPage() {
  const params = useSearchParams()

  const cardType =
    params.get('type') === 'pan'
      ? 'PAN'
      : 'Aadhaar'

  const [front, setFront] =
    useState('')

  const [back, setBack] =
    useState('')

  const [working, setWorking] =
    useState(false)

  const createPDF = async () => {
    if (!front || !back) {
      alert(
        'Front aur Back dono upload karein'
      )
      return
    }

    try {
      setWorking(true)

      const frontImage =
        await cardCrop(front)

      const backImage =
        await cardCrop(back)

      const pdf =
        new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })

      const cardW = 85.6
      const cardH = 53.98

      const x =
        (210 - cardW) / 2

      const gap = 12

      const startY =
        (297 -
          (cardH * 2 + gap)
        ) / 2

      pdf.setFontSize(9)

      pdf.text(
        cardType + ' - Front',
        x,
        startY - 4
      )

      pdf.addImage(
        frontImage,
        'JPEG',
        x,
        startY,
        cardW,
        cardH
      )

      const backY =
        startY + cardH + gap

      pdf.text(
        cardType + ' - Back',
        x,
        backY - 4
      )

      pdf.addImage(
        backImage,
        'JPEG',
        x,
        backY,
        cardW,
        cardH
      )

      pdf.save(
        cardType +
        '_Print_Ready.pdf'
      )

      alert(
        'PDF ready hai. Ab normal Document Print page me downloaded PDF upload karein.'
      )

      window.location.href =
        '/print'

    } catch (error) {
      console.error(error)

      alert(
        'PDF error: ' +
        error.message
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
            {cardType === 'PAN'
              ? '💳'
              : '🪪'}{' '}
            {cardType} Card Print
          </h1>

          <p style={styles.subtitle}>
            Front aur back upload karein.
            System same A4 page par proper
            card size me set karega.
          </p>
        </div>
      </div>

      <div style={styles.grid}>
        <UploadBox
          title="1. FRONT SIDE"
          value={front}
          setValue={setFront}
        />

        <UploadBox
          title="2. BACK SIDE"
          value={back}
          setValue={setBack}
        />
      </div>

      <div style={styles.summary}>
        <strong>
          Final Print
        </strong>

        <span>
          A4 • Front + Back •
          Approx. 85.6 × 54 mm
        </span>
      </div>

      <button
        style={styles.mainButton}
        disabled={working}
        onClick={createPDF}
      >
        {working
          ? 'Creating PDF...'
          : 'Create Print-Ready PDF'}
      </button>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background:
      'linear-gradient(145deg,#eef2ff,#ede9fe)',
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
    background: 'white',
    color: '#5146d8',
    padding: '10px 14px',
    borderRadius: 12,
    fontWeight: 700
  },

  heading: {
    margin: 0,
    fontSize: 28
  },

  subtitle: {
    color: '#727b8d',
    marginTop: 5
  },

  grid: {
    maxWidth: 950,
    margin: 'auto',
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit,minmax(300px,1fr))',
    gap: 18
  },

  uploadCard: {
    background: 'white',
    padding: 20,
    borderRadius: 22,
    boxShadow:
      '0 12px 35px rgba(40,45,80,.10)'
  },

  cardTitle: {
    fontSize: 16,
    color: '#5146d8'
  },

  uploadButton: {
    minHeight: 260,
    border:
      '3px dashed #887eea',
    borderRadius: 18,
    background: '#f8f7ff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 18
  },

  help: {
    color: '#82899a',
    fontSize: 13,
    marginTop: 6
  },

  cropWindow: {
    aspectRatio: '1.586 / 1',
    overflow: 'hidden',
    borderRadius: 14,
    border:
      '3px solid #5146d8',
    background: '#eee'
  },

  cropImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  changeButton: {
    display: 'block',
    textAlign: 'center',
    marginTop: 12,
    background: '#eceaff',
    color: '#5146d8',
    padding: 12,
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 700
  },

  summary: {
    maxWidth: 950,
    margin: '18px auto',
    background: 'white',
    padding: 16,
    borderRadius: 15,
    display: 'flex',
    justifyContent:
      'space-between',
    gap: 10
  },

  mainButton: {
    display: 'block',
    width: 'min(950px,100%)',
    margin: '20px auto',
    padding: 18,
    border: 0,
    borderRadius: 16,
    background:
      'linear-gradient(135deg,#625be8,#4338ca)',
    color: 'white',
    fontSize: 18,
    fontWeight: 800,
    cursor: 'pointer'
  }
}
`;

fs.writeFileSync(
  path.join(dir, "page.js"),
  page,
  "utf8"
);

console.log(
  "Created: app/id-card/page.js"
);

// Install jsPDF
console.log(
  "\nInstalling jsPDF..."
);

execSync(
  "npm install jspdf",
  {
    stdio: "inherit"
  }
);

// Build check
console.log(
  "\nChecking production build..."
);

execSync(
  "npm run build",
  {
    stdio: "inherit"
  }
);

console.log(
  "\n================================"
);

console.log(
  "AADHAAR / PAN MODULE READY"
);

console.log(
  "================================"
);

console.log(
  "\nAadhaar:"
);

console.log(
  "http://localhost:3000/id-card?type=aadhaar"
);

console.log(
  "\nPAN:"
);

console.log(
  "http://localhost:3000/id-card?type=pan"
);