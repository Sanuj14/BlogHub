# BlogHub ✍️

A modern blog platform — write, publish and discover stories. Rebuilt with an **Aurora Glass** UI, a subtle 3D hero, clean JWT auth, and a real MongoDB backend that deploys to **Vercel**.

- **Backend:** Node.js + Express + Mongoose (MongoDB), JWT auth
- **Frontend:** static HTML + vanilla JS + custom CSS (no build step), Three.js hero
- **Deploy:** Vercel (serverless) + MongoDB Atlas (free)

---

## 1. Run it locally

### Prerequisites
- [Node.js](https://nodejs.org) 18+ installed
- A MongoDB database. Either local MongoDB **or** a free MongoDB Atlas cluster (see Section 3 — recommended, and required for Vercel).

### Steps
```bash
# 1. install dependencies
npm install

# 2. create your environment file
#    copy .env.example to .env, then fill in the values
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux

# 3. start the dev server (auto-reloads)
npm run dev
```
Open **http://localhost:3000** 🎉

Your `.env` needs:
```
MONGODB_URI=mongodb+srv://...        # your connection string
JWT_SECRET=some_long_random_string   # any long random text
PORT=3000
```

---

## 2. How it works (quick tour)

| Path | What it is |
|------|-----------|
| `app.js` | Express app: serves `public/` + mounts the API |
| `api/index.js` | Vercel serverless entry (just re-exports `app.js`) |
| `config/db.js` | Cached MongoDB connection (serverless-safe) |
| `middleware/auth.js` | JWT verify + token signing |
| `models/` | `User` and `Blog` (comments + likes are embedded in Blog) |
| `routes/auth.js` | `register`, `login`, `me` |
| `routes/blogs.js` | list / featured / mine / create / read / update / delete / like / comment |
| `public/` | the whole frontend (HTML pages + `js/` + `css/`) |

**API base:** everything lives under `/api` (e.g. `POST /api/auth/login`, `GET /api/blogs`).

---

## 3. Create a free MongoDB Atlas database

1. Go to <https://www.mongodb.com/cloud/atlas/register> and sign up.
2. **Create a cluster** → choose the free **M0** tier → pick a region → *Create*.
3. **Database Access** (left menu) → *Add New Database User* → set a username & password (remember them) → *Add User*.
4. **Network Access** → *Add IP Address* → **Allow Access From Anywhere** (`0.0.0.0/0`) → *Confirm*.
   *(Required so Vercel's servers can connect.)*
5. **Database** → *Connect* → *Drivers* → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<user>` and `<password>` with the ones from step 3, and add a database name (`bloghub`) before the `?`:
   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/bloghub?retryWrites=true&w=majority
   ```
   That final string is your `MONGODB_URI`.

---

## 4. Deploy to Vercel

### A. Push to GitHub
```bash
git init
git add .
git commit -m "BlogHub rebuild"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/bloghub.git
git branch -M main
git push -u origin main
```

### B. Import on Vercel
1. Go to <https://vercel.com> → sign in with GitHub.
2. **Add New… → Project** → import your `bloghub` repo.
3. Framework preset: **Other** (leave build settings as default — there's no build step).
4. Expand **Environment Variables** and add:
   | Name | Value |
   |------|-------|
   | `MONGODB_URI` | your Atlas connection string from Section 3 |
   | `JWT_SECRET` | any long random string |
5. Click **Deploy**. Done — you'll get a `https://your-app.vercel.app` URL.

### How the deploy is wired
- `public/` is served as static files by Vercel's CDN.
- `api/index.js` runs the Express app as a serverless function.
- `vercel.json` rewrites every `/api/*` request to that function.

To redeploy after changes: just `git push` — Vercel rebuilds automatically.

---

## 5. Notes
- **Cover images are URLs** (paste any image link, e.g. from Unsplash). This keeps the app serverless-friendly — Vercel has a read-only filesystem, so file uploads aren't used.
- First request after a deploy can be a little slow ("cold start") while the DB connection warms up — that's normal on serverless.
- Never commit your real `.env` — it's already in `.gitignore`.

---

## 6. Cleanup (removing old files)
This rebuild replaced a lot of legacy files. Run the included script once to delete the dead ones:
```powershell
# from the project folder, in PowerShell:
./cleanup.ps1
```
See `cleanup.ps1` for the exact list it removes.
