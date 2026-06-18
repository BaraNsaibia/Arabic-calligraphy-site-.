async function test() {
  const url = 'http://localhost:5000/wamp-api/orders/create.php';
  const payload = {
    customerName: 'Test Proxy Client',
    customerPhone: '+21677777777',
    customerEmail: 'proxy-client-test@nsaibia.com',
    shippingAddress: '456 Proxy Avenue, Tunis',
    paymentMethod: 'cash_on_delivery',
    paymentReference: '',
    guest_token: 'proxy_test_token_56789',
    items: [
      {
        artworkId: 'bismillah-horizontal',
        quantity: 1,
        frameType: 'classic_wood',
        unitPrice: 200
      }
    ]
  };

  console.log('Sending request to local proxy:', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

test();
