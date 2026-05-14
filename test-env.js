const fs = require('fs');
const path = require('path');

function checkEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('.env.local NOT FOUND at ' + envPath);
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  console.log('--- .env.local Content Check ---');
  
  const keys = [
    'GEMINI_API_KEY',
    'OPENROUTER_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  ];

  keys.forEach(key => {
    const match = content.match(new RegExp(`^${key}=(.*)`, 'm'));
    if (match) {
      const val = match[1].trim();
      console.log(`${key}: FOUND (starts with ${val.substring(0, 5)}...)`);
    } else {
      console.log(`${key}: NOT FOUND`);
    }
  });
  console.log('-------------------------------');
}

checkEnv();
