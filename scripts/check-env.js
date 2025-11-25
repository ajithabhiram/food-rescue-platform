#!/usr/bin/env node

// Environment Variables Checker
// Validates that all required environment variables are set

const fs = require('fs');
const path = require('path');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
];

const envPath = path.join(process.cwd(), '.env.local');

console.log('🔍 Checking environment variables...\n');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('\n💡 Run: cp .env.local.example .env.local');
  process.exit(1);
}

// Read .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

// Check each required variable
let allValid = true;
const issues = [];

requiredVars.forEach(varName => {
  const value = envVars[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: Missing`);
    issues.push(`${varName} is not set`);
    allValid = false;
  } else if (value.includes('placeholder') || value.includes('your-project') || value.includes('your-')) {
    console.log(`⚠️  ${varName}: Still has placeholder value`);
    issues.push(`${varName} needs to be updated with actual Supabase value`);
    allValid = false;
  } else if (varName === 'NEXT_PUBLIC_APP_URL' && value === 'http://localhost:3000') {
    console.log(`✅ ${varName}: ${value} (default for development)`);
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

console.log('');

if (allValid) {
  console.log('🎉 All environment variables are configured correctly!');
  console.log('\n✨ You can now run: npm run dev');
  process.exit(0);
} else {
  console.log('❌ Environment configuration incomplete\n');
  console.log('Issues found:');
  issues.forEach(issue => console.log(`  - ${issue}`));
  console.log('\n📚 See INSTALLATION.md for setup instructions');
  console.log('🔗 Get your Supabase keys: https://supabase.com/dashboard/project/_/settings/api');
  process.exit(1);
}
