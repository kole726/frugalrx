const fetch = require('node-fetch');

async function disablePasswordProtection() {
  try {
    // Get your token from the Vercel CLI config
    const token = process.env.VERCEL_TOKEN || 'YOUR_VERCEL_TOKEN';
    const teamId = 'team_KEXELRGTZgmLKIC5y1oL28kB'; // From .vercel/project.json
    const projectId = 'prj_wzzmA38YrImXXyG7WuhtKrYBG5Rb'; // From .vercel/project.json

    const response = await fetch(`https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        passwordProtection: null
      })
    });

    const data = await response.json();
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('Password protection disabled successfully');
    } else {
      console.error('Failed to disable password protection:', data.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

disablePasswordProtection(); 