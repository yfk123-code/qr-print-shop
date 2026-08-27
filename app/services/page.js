'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function ServicesPage() {
  const router = useRouter()
  const [shop, setShop] = useState(null)

  useEffect(() => {
    async function loadShop() {
      const { data } = await supabase
        .from('owner')
        .select('shop_name,address')
        .limit(1)
        .single()

      if (data) setShop(data)
    }

    loadShop()
  }, [])

  const services = [
    {
      icon: '📄',
      title: 'Document Print',
      subtitle: 'PDF • JPG • PNG',
      desc: 'Normal document printing',
      color: '#6257E8',
      go: () => router.push('/print')
    },
    {
      icon: '🪪',
      title: 'Aadhaar Card',
      subtitle: 'Front + Back',
      desc: 'Proper card size on one A4 sheet',
      color: '#1976D2',
      go: () => router.push('/id-card?type=aadhaar')
    },
    {
      icon: '💳',
      title: 'PAN Card',
      subtitle: 'Front + Back',
      desc: 'Proper PAN card layout on A4',
      color: '#00897B',
      go: () => router.push('/id-card?type=pan')
    },
    {
      icon: '📸',
      title: 'Passport Photos',
      subtitle: '35 × 45 mm',
      desc: 'Create multiple photos on A4',
      color: '#D9468C',
      go: () => router.push('/passport')
    }
  ]

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logo}>🖨️</div>

        <h1 style={styles.shopName}>
          {shop?.shop_name || 'Smart Print'}
        </h1>

        <p style={styles.address}>
          📍 {shop?.address || 'Quick • Easy • Smart Printing'}
        </p>
      </header>

      <section style={styles.panel}>
        <div style={styles.smallTitle}>
          SELECT A SERVICE
        </div>

        <h2 style={styles.title}>
          What do you want to print?
        </h2>

        <p style={styles.help}>
          Neeche apna print type select karein
        </p>

        <div style={styles.grid}>
          {services.map((item) => (
            <button
              key={item.title}
              onClick={item.go}
              style={{
                ...styles.card,
                borderLeft: `6px solid ${item.color}`
              }}
            >
              <div
                style={{
                  ...styles.iconBox,
                  background: item.color + '15',
                  color: item.color
                }}
              >
                {item.icon}
              </div>

              <div style={styles.cardText}>
                <strong style={styles.cardTitle}>
                  {item.title}
                </strong>

                <span
                  style={{
                    ...styles.subtitle,
                    color: item.color
                  }}
                >
                  {item.subtitle}
                </span>

                <span style={styles.desc}>
                  {item.desc}
                </span>
              </div>

              <span style={styles.arrow}>
                ›
              </span>
            </button>
          ))}
        </div>
      </section>

      <div style={styles.how}>
        <strong>How it works</strong>

        <div style={styles.steps}>
          <span>1️⃣ Select</span>
          <span>2️⃣ Upload</span>
          <span>3️⃣ Print</span>
        </div>
      </div>

      <p style={styles.privacy}>
        🔒 Your files are used only for printing.
      </p>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '22px 15px 35px',
    fontFamily: 'Segoe UI, sans-serif',
    color: '#182033',
    background:
      'linear-gradient(160deg,#6179EA 0%,#7255C4 50%,#844EAE 100%)'
  },

  header: {
    textAlign: 'center',
    color: 'white',
    maxWidth: 650,
    margin: '0 auto 24px'
  },

  logo: {
    fontSize: 48,
    marginBottom: 5
  },

  shopName: {
    fontSize: 'clamp(26px,6vw,38px)',
    lineHeight: 1.15,
    margin: '4px 0 8px'
  },

  address: {
    margin: 0,
    opacity: .85,
    fontSize: 15
  },

  panel: {
    maxWidth: 650,
    margin: 'auto',
    padding: '24px 18px',
    borderRadius: 26,
    background: 'rgba(255,255,255,.97)',
    boxShadow: '0 22px 60px rgba(24,17,69,.22)'
  },

  smallTitle: {
    textAlign: 'center',
    color: '#7065D8',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 800
  },

  title: {
    textAlign: 'center',
    fontSize: 25,
    margin: '6px 0'
  },

  help: {
    textAlign: 'center',
    color: '#7A8191',
    margin: '0 0 20px',
    fontSize: 14
  },

  grid: {
    display: 'grid',
    gap: 12
  },

  card: {
    width: '100%',
    borderTop: '1px solid #EAECF2',
    borderRight: '1px solid #EAECF2',
    borderBottom: '1px solid #EAECF2',
    background: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(40,45,85,.06)'
  },

  iconBox: {
    width: 55,
    height: 55,
    minWidth: 55,
    borderRadius: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
    marginRight: 14
  },

  cardText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },

  cardTitle: {
    fontSize: 17,
    color: '#182033'
  },

  subtitle: {
    fontSize: 13,
    fontWeight: 800,
    marginTop: 2
  },

  desc: {
    color: '#858B99',
    fontSize: 12,
    marginTop: 3
  },

  arrow: {
    fontSize: 34,
    color: '#A0A5B2',
    paddingLeft: 8
  },

  how: {
    maxWidth: 650,
    margin: '15px auto 0',
    padding: 15,
    color: 'white',
    textAlign: 'center',
    background: 'rgba(255,255,255,.12)',
    border: '1px solid rgba(255,255,255,.16)',
    borderRadius: 18
  },

  steps: {
    marginTop: 9,
    display: 'flex',
    justifyContent: 'space-around',
    gap: 8,
    flexWrap: 'wrap'
  },

  privacy: {
    textAlign: 'center',
    color: 'rgba(255,255,255,.65)',
    fontSize: 12,
    marginTop: 17
  }
}
