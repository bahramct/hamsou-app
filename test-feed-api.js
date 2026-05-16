import { getToken } from './src/lib/api.js';

async function testFeedAPI() {
  try {
    const token = getToken();
    console.log('Token:', token ? 'exists' : 'not found');

    const response = await fetch('http://localhost:3000/api/community/feed', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));

    if (result.success && result.data && result.data.length > 0) {
      console.log('\nFirst post structure:');
      console.log('- id:', result.data[0].id);
      console.log('- isLiked:', result.data[0].isLiked);
      console.log('- _count:', result.data[0]._count);
      console.log('- likes:', result.data[0].likes);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testFeedAPI();
