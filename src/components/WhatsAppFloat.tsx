'use client';

import React, { useState, useEffect } from 'react';

export default function WhatsAppFloat() {
  const [whatsappNumber, setWhatsappNumber] = useState('8900989005');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.whatsappNumber) {
          setWhatsappNumber(data.settings.whatsappNumber);
        }
      })
      .catch((err) => console.error('Error fetching settings for WhatsApp float:', err));
  }, []);

  return (
    <a
      href={`https://wa.me/91${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-6 right-6 z-50"
      title="Chat on WhatsApp"
    >
      {/* Pulse ring */}
      <span
        className="absolute inset-0 rounded-full animate-ping opacity-30"
        style={{ backgroundColor: '#25D366' }}
      />

      {/* Button */}
      <span
        className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-200"
        style={{ backgroundColor: '#25D366' }}
      >
        <svg
          className="w-8 h-8"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16 2C8.268 2 2 8.268 2 16c0 2.476.648 4.8 1.78 6.812L2 30l5.344-1.72A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6c-2.24 0-4.332-.624-6.124-1.708l-.44-.26-3.168 1.02 1.06-3.1-.284-.456A11.56 11.56 0 014.4 16c0-6.404 5.196-11.6 11.6-11.6S27.6 9.596 27.6 16 22.404 27.6 16 27.6zm6.36-8.684c-.348-.176-2.064-1.02-2.384-1.136-.32-.116-.552-.176-.784.176-.232.352-.9 1.136-1.1 1.368-.204.232-.404.264-.752.088-.348-.176-1.468-.54-2.796-1.724-1.032-.92-1.728-2.056-1.932-2.404-.2-.348-.02-.536.152-.712.156-.156.348-.408.52-.612.176-.204.232-.348.348-.58.116-.232.06-.436-.028-.612-.088-.176-.784-1.892-1.076-2.592-.284-.68-.572-.588-.784-.6l-.668-.012c-.232 0-.608.088-.928.436-.32.348-1.22 1.192-1.22 2.908s1.248 3.372 1.424 3.604c.176.232 2.46 3.756 5.96 5.268.832.36 1.484.576 1.992.736.836.268 1.6.232 2.2.14.672-.1 2.064-.844 2.356-1.66.292-.816.292-1.516.204-1.66-.088-.148-.32-.236-.668-.412z"
            fill="white"
          />
        </svg>
      </span>

      {/* Tooltip */}
      <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md">
        Chat with us
        <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-slate-800" />
      </span>
    </a>
  );
}
