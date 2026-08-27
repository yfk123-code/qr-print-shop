'use client';
import { useState } from 'react';

export default function TrackPage() {
  const [token, setToken] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!token) return alert("Token number daalo!");
    setLoading(true);
    try {
      const res = await fetch(`https://wkvzrurqadxjqkpwngtz.supabase.co/rest/v1/orders?token_number=eq.${token}&select=*`, {
        headers: {
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdnpydXJxYWR4anFrcHduZ3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0Njc0NjgsImV4cCI6MjEwMzA0MzQ2OH0.VDZQkDMNe0mxkRAXy3tV3ZOHFzF3lGeO3Yeur649W4I",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdnpydXJxYWR4anFrcHduZ3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0Njc0NjgsImV4cCI6MjEwMzA0MzQ2OH0.VDZQkDMNe0mxkRAXy3tV3ZOHFzF3lGeO3Yeur649W4I`
        }
      });
      const data = await res.json();
      if (data.length > 0) {
        setOrder(data[0]);
      } else {
        setOrder({ error: "Is token ka koi order nahi mila!" });
      }
    } catch (e) {
      setOrder({ error: "Kuch error aa gaya!" });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <h2 style={{ color: '#101C34', marginBottom: '20px' }}>🔍 Live Order Tracking</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="number" 
          placeholder="Token Number (e.g. 5)" 
          value={token} 
          onChange={(e) => setToken(e.target.value)}
          style={{ padding: '12px', flex: 1, borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
        />
        <button 
          onClick={handleTrack} 
          style={{ padding: '12px 24px', background: '#101C34', color: '#fff', border: '0', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {loading ? 'Checking...' : 'Track Order'}
        </button>
      </div>

      {order && (
        <div style={{ background: '#F1DDD1', padding: '20px', borderRadius: '12px', color: '#101C34', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {order.error ? (
            <p style={{ color: '#C1666B', fontWeight: 'bold' }}>{order.error}</p>
          ) : (
            <div>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}><b>Token Number:</b> #{order.token_number}</p>
              <p style={{ marginBottom: '8px' }}><b>File Name:</b> {order.file_name}</p>
              <p style={{ marginBottom: '8px' }}><b>Pages & Copies:</b> {order.pages} pages × {order.copies} copy</p>
              <p style={{ marginBottom: '8px' }}>
                <b>Order Status:</b> <span style={{ padding: '2px 8px', background: order.order_status === 'approved' ? '#C8E6C9' : '#FFCDD2', borderRadius: '4px' }}>{order.order_status.toUpperCase()}</span>
              </p>
              <p style={{ marginBottom: '0' }}>
                <b>Print Status:</b> {order.print_status === 'success' ? '✅ Printed Successfully' : (order.print_status === 'failed' ? '❌ Print Failed' : '⏳ In Queue')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
