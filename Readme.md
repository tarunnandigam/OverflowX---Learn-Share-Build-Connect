# OverflowX - Project Documentation

OverflowX is a premium, feature-rich **Social Learning & Community Q&A Platform** designed for developers and learners. It combines StackOverflow-like developer Q&A features with a community Social Space, an integrated reputation/points engine, multi-language support secured by OTP validation, and a subscription-based model with customized posting limits.

---

## 🛠️ Tech Stack & Key Libraries

### Frontend (Client-side)
* **Framework:** React 19 (built with Vite)
* **State Management:** Redux Toolkit & React Redux
* **Routing:** React Router DOM (v7)
* **Styling:** Tailwind CSS (v4) with Custom Glassmorphic UI
* **Icons:** Lucide React
* **Content Rendering:** React Markdown, Remark GFM, Rehype Sanitize, and React Syntax Highlighter
* **Authentication:** Google OAuth2 (`@react-oauth/google`) and custom token-based flows
* **Payments:** Razorpay Checkout SDK

### Backend (Server-side)
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB with Mongoose (ODM)
* **Authentication & Security:** JSON Web Tokens (JWT) with secure httpOnly cookies, BcryptJS for password hashing, and Express Rate Limit
* **Email Gateway:** Resend HTTP API (via native Node `fetch`) for transactional email alerts
* **SMS Gateway:** Twilio SMS API integration
* **Media Uploads:** Multer for local uploads and Cloudinary integration support
* **Payments:** Razorpay API Node.js library

---

## 🚀 Key Features & Capabilities

1. **Authentication & Security**: Multi-device login verification, Chrome/New-device 6-digit OTP check, Forgot Password recovery (rate-limited to 1 request/day), and Google OAuth integration.
2. **Developer Q&A Feed**: Markdown-supported question submission, syntax highlighting, upvoting/downvoting, answer acceptance, tag filtering, and sorting (Newest, Active, Unanswered, Votes).
3. **Social Space Feed**: Casual technical micro-posts, media uploads, likes, and nested comment threads.
4. **Subscription Tiers & Usage Limits**:
   * **Free Tier**: 2 questions / 3 social posts per day
   * **Bronze Tier**: 5 questions / 10 social posts per day
   * **Silver Tier**: 15 questions / 25 social posts per day
   * **Gold Tier**: Unlimited daily questions & social posts + priority badge
5. **Localization & Theme System**: 6 supported languages (`en`, `es`, `hi`, `pt`, `zh`, `fr`) with OTP-secured language switching (Email OTP fallback when SMS is unconfigured). Dark/Light/System theme toggling.
