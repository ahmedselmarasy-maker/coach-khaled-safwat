# 🏋️ Daily Workout Tracking Form - Coach.Khaled.Safwat

A professional web application for personal trainers to track their clients' daily workouts. Data is sent via email.

## Features

- ✅ Professional form with black and gold theme
- ✅ Collect personal information (Name, Email, Weight, Date)
- ✅ Track 4 exercises with sets and reps:
  - Incline DB Press (دامبل عالي للصدر)
  - Tricep Pushdown (تراي بوش داون)
  - Wide Lat Pull Down (سحب عالي واسع)
  - T-Bar Row (سحب عالتي بار)
- ✅ Professional file/image upload with drag & drop
- ✅ Send all data to your email

## Tech Stack

- HTML5, CSS3, JavaScript
- Formspree (for email sending - recommended)
- Netlify Functions (Serverless - alternative)
- Node.js (for local development)
- Nodemailer (for email sending with Netlify Functions)

## Project Structure

```
.
├── index.html              # Main page
├── styles.css              # Styling
├── script.js               # JavaScript functionality
├── server.js               # Local development server
├── netlify/
│   └── functions/
│       └── send-email.js   # Email sending function
├── package.json            # Dependencies
├── netlify.toml            # Netlify configuration
└── README.md               # This file
```

## Local Development

### Prerequisites

- Node.js installed
- npm installed

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
TO_EMAIL=talkhanahmed422@gmail.com
PORT=8888
```

3. Run the server:
```bash
npm start
```

4. Open browser:
```
http://localhost:8888
```

## Deployment Options

You have two options for handling form submissions:

### Option 1: Using Formspree (Recommended - Easier)

Formspree is a free service that handles email sending without needing SMTP setup.

**Steps:**
1. Create account at [Formspree.io](https://formspree.io)
2. Create a new form and set recipient email to `talkhanahmed422@gmail.com`
3. Copy your Formspree endpoint URL
4. Open `script.js` and update:
   ```javascript
   const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
   const USE_FORMSPREE = true;
   ```
5. Deploy to Netlify (no environment variables needed!)

**See detailed instructions:** [FORMSPREE_SETUP.md](FORMSPREE_SETUP.md)

### Option 2: Using Netlify Functions (Advanced)

Requires SMTP configuration but gives you full control.

#### Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push this project to GitHub

#### Step 2: Deploy on Netlify

1. Go to [Netlify](https://www.netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Deploy

#### Step 3: Configure Environment Variables

In Netlify dashboard, go to:
**Site settings → Environment variables**

Add these variables:

```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASS = your-app-password
TO_EMAIL = talkhanahmed422@gmail.com
```

**Important:** Replace `your-email@gmail.com` with your actual Gmail address and `your-app-password` with your Gmail app password. The `TO_EMAIL` should be set to `talkhanahmed422@gmail.com` to receive all form submissions.

#### Step 4: Gmail Setup (if using Gmail)

1. Go to [Google Account](https://myaccount.google.com/)
2. Enable 2-Step Verification
3. Create [App Password](https://myaccount.google.com/apppasswords)
4. Use the app password in `SMTP_PASS`

**See detailed instructions:** [NETLIFY_SETUP.md](NETLIFY_SETUP.md)

## Usage

1. Open the application from Netlify URL
2. Fill out the form with required information
3. Add exercise data for all 4 exercises
4. (Optional) Upload an image or file
5. Click "Submit"
6. You'll receive an email with all the information

## Notes

- Make sure environment variables are set correctly
- Use app password, not regular password for Gmail
- File size limit: 10MB

## License

MIT

---

Developed for Coach.Khaled.Safwat 🏋️
