// frontend/src/components/ChatAssistant.jsx
import { useState, useRef, useEffect } from 'react';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy Mol, tu asistente informativo. Puedo darte información general sobre los medicamentos del catálogo. No diagnostico ni receto. ¿En qué te ayudo?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/v1/assistant/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      if (!response.ok) {
        throw new Error('Error en el servidor del asistente');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: data.reply,
        disclaimer: data.disclaimer,
        actions: data.suggested_actions 
      }]);

    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: 'Lo siento, en este momento no puedo conectarme al servidor del asistente. Verifica que el backend esté corriendo.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: 'var(--font)' }}>
      {/* Ventana de Chat */}
      {isOpen && (
        <div className="card" style={{ width: '360px', height: '500px', display: 'flex', flexDirection: 'column', marginBottom: '16px', padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-sm-2)', border: '1px solid var(--color-hairline)' }}>
          
          {/* Header del Chat */}
          <div style={{ background: 'var(--color-signal-blue)', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/assets/mol_paramedico.png" alt="Mol" style={{ width: '36px', height: '36px', background: 'white', borderRadius: '50%', padding: '4px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '15px' }}>Pregúntale a Mol</strong>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>Asistente IA (Prototipo)</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          </div>

          {/* Área de Mensajes */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-cloud)' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  background: msg.role === 'user' ? 'var(--color-signal-blue)' : 'var(--color-paper)',
                  color: msg.role === 'user' ? 'white' : 'var(--color-ink-navy)',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  border: msg.role === 'assistant' ? '1px solid var(--color-hairline)' : 'none',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap' // Para respetar los saltos de línea del backend
                }}>
                  {msg.text}
                </div>
                
                {/* Disclaimer del Backend */}
                {msg.disclaimer && (
                  <div style={{ fontSize: '10px', color: 'var(--color-slate-gray)', marginTop: '6px', paddingLeft: '4px' }}>
                    ⚠️ {msg.disclaimer}
                  </div>
                )}

                {/* Acciones Sugeridas */}
                {msg.actions && msg.actions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {msg.actions.map((action, idx) => (
                      <span key={idx} style={{ fontSize: '11px', background: '#e6f0ff', color: 'var(--color-signal-blue)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                        {action}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--color-paper)', padding: '12px 16px', borderRadius: '16px 16px 16px 0', border: '1px solid var(--color-hairline)', fontSize: '14px', color: 'var(--color-slate-gray)' }}>
                Mol está pensando...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Texto */}
          <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid var(--color-hairline)', display: 'flex', gap: '8px', background: 'white' }}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ej. ¿Para qué sirve el ibuprofeno?"
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-hairline)', outline: 'none', fontSize: '14px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', height: '44px' }} disabled={loading}>
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Botón Flotante */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-signal-blue)', 
          color: 'white', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0, 107, 255, 0.4)', border: '3px solid white', cursor: 'pointer',
          transition: 'transform 0.2s ease',
          marginLeft: 'auto'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}