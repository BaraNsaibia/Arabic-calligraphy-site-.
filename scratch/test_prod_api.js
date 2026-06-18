import vm from 'vm';

async function solveChallenge(html) {
  // Extract the script containing the challenge logic
  const scriptRegex = /<script>([\s\S]*?)<\/script>/;
  const match = html.match(scriptRegex);
  if (!match) {
    throw new Error('No script tag found in challenge HTML');
  }
  let scriptContent = match[1];

  // Fetch the AES library
  console.log('Fetching aes.js to solve challenge...');
  const aesRes = await fetch('https://bara.gamer.free/aes.js');
  const aesJs = await aesRes.text();

  // Create a VM context with document and location mock
  const sandbox = {
    document: {
      cookie: ''
    },
    location: {
      href: ''
    }
  };
  vm.createContext(sandbox);

  // Run the aes.js library inside the VM
  vm.runInContext(aesJs, sandbox);

  // Run the challenge script inside the VM
  vm.runInContext(scriptContent, sandbox);

  console.log('Calculated document.cookie:', sandbox.document.cookie);
  
  // Extract __test cookie value
  const cookieMatch = sandbox.document.cookie.match(/__test=([^;]+)/);
  if (!cookieMatch) {
    throw new Error('Failed to find __test cookie in generated cookie string');
  }

  return cookieMatch[1];
}

async function test() {
  const url = 'https://bara.gamer.free/wamp-api/orders/create.php';
  console.log('Fetching initial page to trigger challenge...');
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const html = await res.text();
    if (html.includes('slowAES')) {
      console.log('JS challenge detected. Solving...');
      const cookieValue = await solveChallenge(html);
      console.log('Success! Cookie value:', cookieValue);

      // Now retry the request with the __test cookie
      console.log('Retrying request with __test cookie...');
      const retryRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `__test=${cookieValue}`
        },
        body: JSON.stringify({
          customerName: 'Test Agent',
          customerPhone: '+21699999999',
          customerEmail: 'agent-test@nsaibia.com',
          shippingAddress: '123 Calligraphy Street, Tunis',
          paymentMethod: 'cash_on_delivery',
          paymentReference: '',
          guest_token: 'agent_test_token_12345',
          items: [
            {
              artworkId: 'inf-alhamdulillah',
              quantity: 1,
              frameType: 'museum_gold',
              unitPrice: 200
            }
          ]
        })
      });

      console.log('Retry status:', retryRes.status, retryRes.statusText);
      const resultText = await retryRes.text();
      console.log('Retry Response Body:', resultText);
    } else {
      console.log('No JS challenge. Initial Response:', html);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
