const https = require('https');

async function testMobileHTML() {
  const videoId = 'z7DmB8NM528';
  
  return new Promise((resolve) => {
    https.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Length: ${data.length}`);
        if (data.includes('ytInitialPlayerResponse')) {
          console.log('✅ Found ytInitialPlayerResponse!');
          const match = data.match(/"captionTracks":\[(.*?)\]/);
          if (match) {
            console.log('✅ Found captionTracks!');
          } else {
            console.log('❌ No captionTracks found.');
          }
        } else {
          console.log('❌ No ytInitialPlayerResponse. Probably blocked or consent page.');
        }
        resolve();
      });
    }).on('error', (e) => {
      console.log('Error:', e.message);
      resolve();
    });
  });
}

testMobileHTML();
