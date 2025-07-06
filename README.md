# Neargud Project BE

This is the backend for the Neargud project. It is a RESTful API built using Express (Node.js) and integrates with a MongoDB database. The project supports various features such as user management, shop reviews, notifications, chat, reels, stories, campaigns, and more.

## Tech Stack

- **Node.js & Express:** Used for the server and API routing.
- **MongoDB:** Database (connection managed via `./config/mongoDbConnection`).
- **Socket.io:** Real-time communication (for chat, notifications, etc.).
- **CORS & Cookie Parser:** Middleware for handling cross-origin requests and cookies.
- **dotenv:** Environment variable management.

## Setup Instructions

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Create a `.env` file (based on `.env.example` if available) and configure your environment variables (e.g. `PORT`, database connection string, etc.).
4. Start the server using `npm start` or `node index.js`.

## API Endpoints

The API endpoints are defined in the `index.js` file and in the `routes` directory. Below is a brief overview of the available endpoints:

- **Admin Routes:**  
  – `/api/admin` – Admin dashboard endpoints.  
  – `/api/admin/aboutUS` – Endpoints for managing "About Us" content.  
  – `/api/admin/policyAndPrivacy` – Endpoints for privacy and policy (admin).  
  – `/api/admin/termsAndConditions` – Endpoints for terms and conditions (admin).  
  – `/api/admin/campaign` – Endpoints for campaign management (admin).  
  – `/api/admin/notification` – Endpoints for notifications (admin).  
  – `/api/admin/categories` – Endpoints for managing categories (admin).

- **User Routes:**  
  – `/api/user` – User endpoints (login, signup, etc.).  
  – `/api/user/location` – Endpoints for user location updates.  
  – `/api/image` – Endpoints for image uploads.  
  – `/api/user/shop` – Endpoints for shop management (user).  
  – `/api/user/subscription` – Endpoints for subscription management.  
  – `/api/user/post` – Endpoints for post (or feed) management.  
  – `/api/user/policyAndPrivacy` – Endpoints for privacy and policy (user).  
  – `/api/user/termsAndConditions` – Endpoints for terms and conditions (user).  
  – `/api/user/aboutUs` – Endpoints for "About Us" (user).  
  – `/api/user/shopReviews` – Endpoints for shop reviews.  
  – `/api/user/faouriteCart` – Endpoints for favorite cart (or wishlist).  
  – `/api/user/notification` – Endpoints for notifications (user).  
  – `/api/user/follower` – Endpoints for follower management.  
  – `/api/user/chat` – Endpoints for chat (using Socket.io).  
  – `/api/user/messages` – Endpoints for messages.  
  – `/api/user/reel` – Endpoints for reels.  
  – `/api/user/story` – Endpoints for stories.  
  – `/api/user/report` – Endpoints for reporting.  
  – `/api/user/campaign` – Endpoints for campaign (user).  
  – `/api/user/categories` – Endpoints for categories (user).

## Project Structure

```
neargud/
├── config/                 # Configuration files (database, environment, etc.)
├── constants/             # Application constants and enums
├── controllers/           # Route controllers (business logic)
├── middleware/            # Custom middleware functions
├── models/               # MongoDB models/schemas
├── routes/               # API route definitions
│   ├── adminRouter.js
│   ├── userRouter.js
│   ├── chatRouter.js
│   ├── notificationRouter.js
│   └── ... (other route files)
├── utils/                # Utility functions and helpers
├── cacheFiles/           # Cache storage directory
├── index.js             # Application entry point
├── package.json         # Project dependencies and scripts
└── README.md            # Project documentation
```



