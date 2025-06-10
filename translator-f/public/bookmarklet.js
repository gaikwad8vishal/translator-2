(async function () {
  const apiUrl = 'https://translator-2-six.vercel.app/translate/';
  const textNodes = [];

  function getTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
      textNodes.push(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of node.childNodes) getTextNodes(child);
    }
  }

  // Floating translate button
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

  // On click → send page text to API → replace with translations
  btn.onclick = async () => {
    getTextNodes(document.body);
    const originalTexts = textNodes.map(n => n.nodeValue);

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: originalTexts }),
      });

      const data = await res.json();
      if (Array.isArray(data.translations)) {
        textNodes.forEach((node, i) => {
          node.nodeValue = data.translations[i] || node.nodeValue;
        });
      } else {
        alert('Translation failed');
      }
    } catch (err) {
      console.error(err);
      alert('Translation error');
    }
  };
})();
