fetch('http://127.0.0.1:3000/api/materials').then(r => console.log(r.status)).catch(e => console.error(e.message))
