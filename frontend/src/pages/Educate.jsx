// frontend/src/pages/Educate.jsx
import React from 'react';

const Educate = () => {
  // Array con la información de tus guías
  const guias = [
    {
      id: 1,
      titulo: 'Abrazo Mental',
      subtitulo: 'Cómo ayudar a un amigo en crisis de ansiedad o pánico',
      descripcion: 'Aprende a acompañar, escuchar y pedir ayuda a tiempo. Una guía para entender qué es un ataque de pánico, qué decir, qué evitar y cómo cuidar de ti también.',
      imagen: '/assets/Guia3.png', // Asegúrate de que este sea el nombre exacto de tu archivo
      linkHotmart: 'https://go.hotmart.com/V108608983A?dp=1' // Reemplaza con tu link de Hotmart
    },
    {
      id: 2,
      titulo: 'Primeros Auxilios Básicos',
      subtitulo: 'Una guía clara para personas sin formación sanitaria',
      descripcion: 'Aprende a reconocer una emergencia, pedir ayuda y actuar sin improvisar. Medidas iniciales de seguridad, señales de alerta y qué no debes hacer bajo ninguna circunstancia.',
      imagen: '/assets/Guia2.png',
      linkHotmart: 'https://go.hotmart.com/V108608983A?dp=1'
    },
    {
      id: 3,
      titulo: 'Manual para Trasnochadores',
      subtitulo: 'Higiene del sueño, cafeína y energía real',
      descripcion: 'Aprende a cuidar tu sueño, a usar la cafeína con cabeza y a reconocer cuándo tu cuerpo te pide parar. Recupera tu energía de forma saludable.',
      imagen: '/assets/Guia1.png',
      linkHotmart: 'https://go.hotmart.com/V108608983A?dp=1'
    }
  ];

  return (
    <div className="educate-container">
      <div className="educate-header">
        <h1>Educate con MediCore</h1>
        <p>Adquiere nuestras guías en PDF y aprende a cuidar de ti y de los tuyos con información confiable y práctica.</p>
      </div>

      <div className="guias-grid">
        {guias.map((guia) => (
          <div key={guia.id} className="guia-card">
            <div className="guia-image-wrapper">
              <img src={guia.imagen} alt={`Portada de ${guia.titulo}`} className="guia-image" />
            </div>
            
            <div className="guia-content">
              <h2>{guia.titulo}</h2>
              <h3>{guia.subtitulo}</h3>
              <p>{guia.descripcion}</p>
              
              <a 
                href={guia.linkHotmart} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-hotmart"
              >
                Adquirir Guía
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Educate;