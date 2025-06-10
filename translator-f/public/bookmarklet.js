(async function () {
  const apiUrl = 'https://translator-2-six.vercel.app/translate/';
  const fromLang = 'en'; // 🔁 Change as needed or make dynamic
  const toLang = 'hi';   // 🔁 Change as needed or make dynamic
  const textNodes = [];

  function getTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
      textNodes.push(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of node.childNodes) getTextNodes(child);
    }
  }

  // Create floating button
  const btn = document.createElement('button');
  btn.innerText = '🌐';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: '24px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 0 10px rgba(0,0,0,0.3)'
  });
  document.body.appendChild(btn);

  btn.onclick = async () => {
    getTextNodes(document.body);

    for (const node of textNodes) {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: node.nodeValue,
            from: fromLang,
            to: toLang
          })
        });

        const data = await res.json();
        if (data.translatedText) {
          node.nodeValue = data.translatedText;
        }
      } catch (err) {
        console.error('Error translating:', node.nodeValue, err);
      }
    }
  };
})();
