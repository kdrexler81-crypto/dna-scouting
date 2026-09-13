import React, { useEffect } from 'react';

export default function InstagramFeed() {
  useEffect(() => {
    // 1. Check if the script is already loaded to prevent duplicates
    if (document.getElementById('EmbedSocialHashtagScript')) {
      return;
    }

    // 2. Create the script element
    const script = document.createElement('script');
    script.id = 'EmbedSocialHashtagScript';
    script.src = 'https://embedsocial.com/cdn/ht.js';
    script.async = true;

    // 3. Append it to the head of the document
    document.head.appendChild(script);

    // Clean up function when the component unmounts
    return () => {
      const existingScript = document.getElementById('EmbedSocialHashtagScript');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="bg-slate-900 border-t-4 border-[#d6336c] rounded-xl shadow-xl p-6 mb-8 text-center">
      <h2 className="text-xl font-bold text-white uppercase mb-4 tracking-widest flex items-center justify-center gap-2">
        Live Feed
      </h2>
      
      {/* 4. Paste the specific DIV provided by EmbedSocial here */}
      <div 
        className="embedsocial-hashtag" 
        data-ref="171b2b8fc5526a1ffe177592aa743e50b4f31459"
      >
        <a 
          className="feed-powered-by-es feed-powered-by-es-feed-new" 
          href="https://embedsocial.com/social-media-aggregator/" 
          target="_blank" 
          rel="noopener noreferrer" 
          title="Instagram widget"
        >
          Instagram widget
        </a>
      </div>
    </div>
  );
}