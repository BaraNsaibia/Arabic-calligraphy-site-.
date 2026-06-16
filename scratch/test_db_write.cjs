const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function runTest() {
  const registerPayload = {
    name: "Test User",
    email: "testuser_" + Math.floor(Math.random() * 10000) + "@nsaibia.com",
    password: "password123"
  };

  try {
    console.log("Sending registration payload to local PHP server...");
    const res = await fetch("http://127.0.0.1:8000/auth/register.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(registerPayload)
    });

    const data = await res.json();
    console.log("Response:", data);

    if (data.ok) {
      console.log("SUCCESS! User registered successfully!");
    } else {
      console.error("FAILED to register user:", data.error);
    }
  } catch (err) {
    console.error("Network or fetch error:", err);
  }
}

runTest();
