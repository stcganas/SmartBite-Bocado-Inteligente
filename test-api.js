fetch('http://localhost:3000/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: "gemini-3.5-flash",
    contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    config: { temperature: 0.7, responseMimeType: "application/json" }
  })
}).then(r => r.text().then(t => console.log('STATUS:', r.status, 'BODY:', t)))
.catch(e => console.error(e));
