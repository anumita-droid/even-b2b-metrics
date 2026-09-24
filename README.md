# Even B2B Dashboard

## Deploy in 10 minutes

### Step 1 — Push to GitHub
1. Create a new GitHub repo called `even-b2b-dashboard`
2. Upload all files in this folder to the repo
3. Go to Settings → Pages → Deploy from main branch → Save

### Step 2 — Deploy API to Vercel
1. Go to vercel.com → New Project → Import your GitHub repo
2. Under **Environment Variables**, add:
   - Key: `METABASE_API_KEY`
   - Value: `mb_70MbV+WFKrpUwAhMbEI9kpWNoVripR0RKvy7tvGyrKo=`
3. Click Deploy
4. Copy your Vercel URL (e.g. `https://even-b2b-dashboard.vercel.app`)

### Step 3 — Update dashboard URL
In `public/index.html`, line 1 of the script, update:
```js
const VERCEL_URL = 'https://even-b2b-dashboard.vercel.app'; // paste your Vercel URL here
```
Commit and push.

### Step 4 — Make Master List public
In Google Sheets (Master List):
- Share → Anyone with the link → Viewer
- That's it — dashboard will read it as CSV automatically

### Done
Your GitHub Pages URL will be:
`https://yourusername.github.io/even-b2b-dashboard/`

Dashboard auto-refreshes data on every open. No permissions, no login needed.
