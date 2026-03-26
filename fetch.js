const https = require('https');
https.get('https://mja-ai-assessment.netlify.app/', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
