const fetch = require('node-fetch');

async function test() {
  try {
    // 1. Login
    const loginRes = await fetch('http://127.0.0.1:8000/auth/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nsaibia.com', password: 'password123' }) // Assuming a password
    });
    
    const loginData = await loginRes.json();
    console.log("Login:", loginData);
    
    if (!loginData.token) {
        console.log("No token, can't continue test.");
        // let's try just hitting the endpoint
        const fetchRes = await fetch('http://127.0.0.1:8000/orders/index.php');
        console.log("Fetch without token:", await fetchRes.text());
        return;
    }
    
    // 2. Fetch orders
    const fetchRes = await fetch('http://127.0.0.1:8000/orders/index.php', {
      headers: { 'Authorization': 'Bearer ' + loginData.token }
    });
    
    const text = await fetchRes.text();
    console.log("Fetch Orders:", text);
  } catch (err) {
    console.error(err);
  }
}

test();
