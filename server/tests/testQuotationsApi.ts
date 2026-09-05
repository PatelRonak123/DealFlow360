const API_BASE = 'http://localhost:5000/api/v1';

async function testQuotationsApi() {
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales.manager@dealflow360.io', password: 'Password@123' }),
  });
  const token = (await loginRes.json()).data.accessToken;

  const res = await fetch(`${API_BASE}/quotations?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Total Quotations returned:', data.data?.length);
  console.log('Pagination info:', data.pagination);
  console.log('Sample Quotation with details:', JSON.stringify(data.data?.[0], null, 2));
}

testQuotationsApi().catch(console.error);
