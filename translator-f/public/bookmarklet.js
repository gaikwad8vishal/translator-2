(async function () {
  const apiUrl = 'https://translator-2-1.onrender.com/translate/';
  const fromLang = 'en';
  const toLang = 'hi';
  const textNodes = [];

  function getTextNodes(node) {
    if (
      node.nodeType === Node.TEXT_NODE &&
      node.nodeValue.trim() &&
      node.parentNode.nodeName !== 'SCRIPT' &&
      node.parentNode.nodeName !== 'STYLE'
    ) {
      textNodes.push(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of node.childNodes) getTextNodes(child);
    }
  }

  // Inject CSS spinner style once
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    #translator-btn.spinning {
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(style);

  // Load Axios only once
  if (typeof axios === 'undefined') {
    const axiosScript = document.createElement('script');
    axiosScript.src = 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
    axiosScript.onload = () => initButton();
    document.head.appendChild(axiosScript);
  } else {
    initButton();
  }

  // Main initializer
  function initButton() {
    if (document.getElementById('translator-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'translator-btn';
    btn.innerText = '🌐';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '9999',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      backgroundColor: '#007bff',
      color: '#fff',
      fontSize: '24px',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 0 10px rgba(0,0,0,0.3)',
    });
    document.body.appendChild(btn);

    // Mark button as added
    localStorage.setItem('translatorButtonShown', 'true');

    btn.onclick = async () => {
      getTextNodes(document.body);
      btn.classList.add('spinning');

      for (const node of textNodes) {
        const text = node.nodeValue.trim();
        if (!text || text.length > 1000) continue;

        try {
          const res = await axios.post(apiUrl, {
            text,
            from: fromLang,
            to: toLang,
          });

          if (res.data?.translatedText) {
            node.nodeValue = res.data.translatedText;
          } else {
            console.warn('⚠️ No translatedText in response for:', text);
          }
        } catch (err) {
          console.error('❌ Failed to translate:', text, err.message);
        }
      }

      btn.classList.remove('spinning');
    };
  }

  // Ensure icon shows up even on reload
  const showOnLoad = () => {
    if (localStorage.getItem('translatorButtonShown') === 'true') {
      initButton();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showOnLoad);
  } else {
    showOnLoad();
  }
})();
