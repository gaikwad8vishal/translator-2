(async function () {
  const apiUrl = 'https://translator-2-1.onrender.com/translate/';
  const fromLang = 'en';
  const textNodes = [];
  let toLang = localStorage.getItem('preferredTranslationLang') || 'hi';

  const languages = {
    hi: 'Hindi',
    mr: 'Marathi',
    ta: 'Tamil',
    te: 'Telugu',
    gu: 'Gujarati',
    bn: 'Bengali',
    kn: 'Kannada',
    ml: 'Malayalam',
    ur: 'Urdu',
    pa: 'Punjabi'
  };

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

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    #translator-btn.spinning {
      animation: spin 1s linear infinite;
    }
    #lang-select {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 9999;
      padding: 6px;
      border-radius: 8px;
      border: 1px solid #ccc;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);

  if (typeof axios === 'undefined') {
    const axiosScript = document.createElement('script');
    axiosScript.src = 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
    axiosScript.onload = initUI;
    document.head.appendChild(axiosScript);
  } else {
    initUI();
  }

  function initUI() {
    if (document.getElementById('translator-btn')) return;

    // 🌐 Button
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

    // 🌐 Dropdown
    const select = document.createElement('select');
    select.id = 'lang-select';

    Object.entries(languages).forEach(([code, name]) => {
      const option = document.createElement('option');
      option.value = code;
      option.text = name;
      if (code === toLang) option.selected = true;
      select.appendChild(option);
    });

    select.onchange = (e) => {
      toLang = e.target.value;
      localStorage.setItem('preferredTranslationLang', toLang);
    };

    document.body.appendChild(select);

    // Translate logic
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }
})();
