<div align="center">

<img src="public/logo.svg" alt="BlogHub" width="400" />

# ✳ BLOGHUB

### Write without rules.

A full-stack, neo-brutalist blogging platform — write, publish and discover stories.
Bold typography, hard edges, a custom cursor, and a cursor-reactive interactive hero.

![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-ffe500?style=for-the-badge)

</div>

---

## ✨ Features

- 🔐 **Full authentication** — register, log in, and stay signed in with JWT (no server session storage, so it works great on serverless).
- ✍️ **Write & manage posts** — a clean editor with cover images, tags, categories, and **draft / published** states.
- 🗂 **Full CRUD** — create, read, update and delete your own stories; edit anytime.
- ❤️ **Likes & 💬 comments** — real engagement on every post.
- 🔎 **Search, filter & paginate** — find stories by keyword or category.
- 📊 **Personal dashboard** — your posts, total views, likes and drafts at a glance.
- 🎨 **Neo-brutalist design** — Archivo Black display type, Space Mono labels, hard borders, offset shadows, yellow/red accents.
- 🖱️ **Custom cursor** — a blend-mode cursor that grows over interactive elements.
- 🧨 **Interactive hero** — a cursor-reactive 2D canvas (asterisks that web out, flash and ripple on click).
- 📱 **Fully responsive** and **serverless-ready** for Vercel.

---

## 🛠 Tech Stack

| Layer     | Tech |
|-----------|------|
| Backend   | Node.js, Express |
| Database  | MongoDB + Mongoose (MongoDB Atlas) |
| Auth      | JSON Web Tokens (custom HS256, built on Node `crypto`) + `bcryptjs` |
| Frontend  | Vanilla JavaScript, HTML, custom CSS (no framework, no build step) |
| Hosting   | Vercel (serverless functions + static CDN) |

> No build tooling, no bundler — the frontend is plain static files, which keeps the whole thing simple to run and deploy.

---

## 📸 Screenshots

> _Add your own once it's running — drop images in a `screenshots/` folder and link them here._
>
> ```md
> ![Home](screenshots/home.png)
> ![Dashboard](screenshots/dashboard.png)
> ```

---

## 📂 Project Structure

```
BLogHub/
├── api/
│   └── index.js          # Vercel serverless entry (re-exports the Express app)
├── config/
│   └── db.js             # Cached MongoDB connection (serverless-safe)
├── middleware/
│   └── auth.js           # JWT sign/verify + auth guards
├── models/
│   ├── User.js
│   └── Blog.js           # comments + likes embedded
├── routes/
│   ├── auth.js           # register · login · me
│   └── blogs.js          # list · featured · mine · CRUD · like · comment
├── public/               # the entire frontend (served statically)
│   ├── css/style.css
│   ├── js/               # config, ui, hero, page scripts
│   └── *.html            # index, blogs, blog-detail, create/edit, login, register, dashboard, about, 404
├── app.js                # Express app (static + API + connects DB)
├── vercel.json           # routes /api/* to the serverless function
├── .env.example
└── package.json
```

---

## 🚀 Quick Start (Local)

**Prerequisites:** [Node.js 18+](https://nodejs.org) and a MongoDB database (Atlas recommended — see below).

```bash
# 1. install dependencies
npm install

# 2. create your env file, then edit it
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux

# 3. run the dev server (auto-reloads)
npm run dev
```

Open **http://localhost:3000** 🎉

---

## 🔑 Environment Variables

Create a `.env` file (copied from `.env.example`) with:

| Variable       | Description | Example |
|----------------|-------------|---------|
| `MONGODB_URI`  | Your MongoDB connection string | `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/bloghub` |
| `JWT_SECRET`   | Any long random string used to sign login tokens | `a-very-long-random-string` |
| `PORT`         | (Optional) local port | `3000` |

> 🔒 `.env` is git-ignored — your secrets never get committed.

---

## 🍃 Set Up a Free MongoDB Atlas Database

1. Sign up at **[mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)**.
2. **Create a cluster** → choose the free **M0** tier → pick a region → *Create*.
3. **Database Access** → *Add New Database User* → set a username & password (remember them).
4. **Network Access** → *Add IP Address* → **Allow Access From Anywhere** (`0.0.0.0/0`) → *Confirm*.
   _(Required so Vercel's servers can connect.)_
5. **Database → Connect → Drivers** → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<user>`/`<password>`, and add the database name `bloghub` before the `?`:
   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/bloghub?retryWrites=true&w=majority
   ```
   That's your `MONGODB_URI`. ✅

---

## ▲ Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "BlogHub"
git branch -M main
git remote add origin https://github.com/Sanuj14/BlogHub.git
git push -u origin main
```

### Step 2 — Import on Vercel
1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. **Add New… → Project** → import your **BlogHub** repo.
3. **Framework Preset:** `Other` (there's no build step — leave build settings default).
4. Expand **Environment Variables** and add:

   | Name          | Value |
   |---------------|-------|
   | `MONGODB_URI` | your Atlas connection string |
   | `JWT_SECRET`  | a long random string |

5. Click **Deploy**. 🚀 You'll get a live `https://your-app.vercel.app` URL in ~30 seconds.

### How the deploy works
- `public/` is served as static files from Vercel's global CDN.
- `api/index.js` runs the Express app as a serverless function.
- `vercel.json` rewrites every `/api/*` request to that function.
- The Mongo connection is cached between invocations (`config/db.js`) so cold starts stay fast.

> 🔁 **To update:** just `git push` — Vercel redeploys automatically.

---

## 🔌 API Reference

Base path: `/api`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/auth/register` | – | Create an account, returns a token |
| `POST` | `/auth/login` | – | Log in, returns a token |
| `GET`  | `/auth/me` | ✅ | Current user |
| `GET`  | `/blogs` | – | List posts (`?page`, `?limit`, `?search`, `?category`) |
| `GET`  | `/blogs/featured` | – | Newest / most-viewed posts |
| `GET`  | `/blogs/mine` | ✅ | Your posts (incl. drafts) |
| `GET`  | `/blogs/:id` | – | Single post (+ related, increments views) |
| `POST` | `/blogs` | ✅ | Create a post |
| `PUT`  | `/blogs/:id` | ✅ | Update a post |
| `DELETE` | `/blogs/:id` | ✅ | Delete a post |
| `POST` | `/blogs/:id/like` | ✅ | Toggle like |
| `POST` | `/blogs/:id/comments` | ✅ | Add a comment |

Send the token as: `Authorization: Bearer <token>`

---

## 🧹 Cleanup

This repo was rebuilt from an older version. To remove leftover legacy files, run once:

```powershell
./cleanup.ps1
```

---

## 📝 Notes

- **Cover images are URLs** (paste any image link, e.g. from Unsplash) — this keeps the app serverless-friendly, since Vercel's filesystem is read-only.
- Built on Node's built-in `crypto` for JWTs, so it runs on any modern Node version with zero native dependencies.

---

<div align="center">

**Built to disrupt.** · Made with ♥ by [Sanuj](https://github.com/Sanuj14)

⭐ Star this repo if you like it!

</div>
