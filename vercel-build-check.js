/* eslint-disable no-undef */
const https = require('https');

async function checkCI() {
  if (process.env.VERCEL_GIT_COMMIT_REF === "main") {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/keaqqqqq/expense-tracker-app/commits/${process.env.VERCEL_GIT_COMMIT_SHA}/check-runs`,
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Vercel-Build',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    return new Promise((resolve, reject) => {
      https.get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const checks = JSON.parse(data);
          const ciCheck = checks.check_runs.find(check => check.name === 'verify');
          if (ciCheck?.conclusion !== 'success') {
            reject(new Error('CI checks have not passed'));
          }
          resolve();
        });
      }).on('error', reject);
    });
  }
}

checkCI().catch(() => process.exit(1));