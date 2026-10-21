# Cakna 

**Cakna** is a health companion web application designed to help older adults manage their daily health routines while allowing caregivers to monitor their well-being remotely. Developed by **Team Clover**, the application focuses on medication tracking, daily health check-ins, AI-assisted guidance, and communication between older adults and their caregivers.

## Technology Stack

| Component                  | Technology                       |
| -------------------------- | -------------------------------- |
| Frontend                   | React 19, Vite                   |
| Backend                    | Node.js, Express 5               |
| Database                   | MongoDB, Mongoose                |
| Authentication             | JSON Web Tokens (JWT), bcryptjs  |
| AI assistance              | Google Gemini API                |
| Medicine label recognition | Tesseract.js (English and Malay) |
| Media hosting              | Cloudinary                       |
| Deployment                 | Vercel                           |
| API testing support        | Postman collection               |

## Features and Implementation Status

| Feature                                                                     | Status                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Registration and login for older adults and caregivers                      | Implemented                                                               |
| Caregiver account linking using a pairing code                              | Implemented                                                               |
| AI-assisted health check-ins for sleep, meals, blood pressure, and symptoms | Implemented                                                               |
| Meal photo analysis with estimated nutritional information                  | Implemented                                                               |
| Health dashboard and sleep tracking                                         | Implemented                                                               |
| Medication management and daily dose tracking                               | Implemented                                                               |
| Medication dose video uploads and caregiver notes                           | Implemented; Cloudinary configuration required                            |
| Caregiver overview, health information, and alerts                          | Implemented                                                               |
| Caregiver control over whether older adults can add medication              | Implemented                                                               |
| Cakna AI health chatbot and SOS feature                                     | Implemented                                                               |
| Appointment management                                                      | Basic list and form implemented                                           |
| Wellness video feed                                                         | Interface and local video metadata available; configure valid media links |
| Scheduled reminders and push notifications                                  | Not implemented                                                           |
| Persistent settings for sound and language preferences                      | Not implemented                                                           |

*Implementation status describes the current application code and does not imply that every feature has been independently validated in a production environment.*

## System Architecture

Cakna follows a client–server architecture:

1. **Frontend — React and Vite:** Provides the user interface for health check-ins, medication management, appointments, wellness content, and caregiver monitoring.
2. **Backend — Node.js and Express:** Handles API requests, authentication, access control, application logic, and AI-related requests.
3. **Database — MongoDB and Mongoose:** Stores user accounts, health check-ins, meal records, medications, dose logs, appointments, and alerts.
4. **External services:** Google Gemini supports AI-assisted interactions and meal-photo analysis. Cloudinary handles media uploads and hosting.
5. **Deployment — Vercel:** Serves the frontend and routes API requests to the Express application.

## Integrations, APIs, and Libraries

### Google Gemini API

Used for conversational health check-ins, general health-related assistance, and estimating nutritional information from meal photos. The AI provides general guidance and is not intended to diagnose medical conditions or replace professional medical advice.

### Cloudinary

Provides media hosting and direct uploads for video content, including medication dose videos. Uploaded media is referenced through its returned secure URL.

### MongoDB

Provides persistent storage for application records. Mongoose defines and manages the data models used by the backend.

### Tesseract.js

Performs optical character recognition (OCR) on medicine-label images in English and Malay. Extracted text is processed to suggest medication details. Users should verify all extracted information against the original medicine label before saving or using it.

### Internal API

The Express backend provides feature-specific routes for authentication, check-ins, meals, medications, appointments, chat, profiles, overview information, and alerts. The frontend uses a shared API helper to communicate with these routes and attach authentication tokens where required.

A Postman collection is included to support API testing. Its inclusion does not by itself indicate that every endpoint has passed testing.

### Datasets

The application includes locally defined wellness video metadata. No separate external research dataset is currently documented as part of the implementation.

## Getting Started

### Prerequisites

- Node.js **20.6 or newer**
- npm
- A MongoDB database, such as MongoDB Atlas
- A Google Gemini API key
- Cloudinary credentials if testing media uploads

### Installation

1. Clone or download this repository.

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`.

4. Configure the required environment variables:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_long_random_secret
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=your_supported_gemini_model
   VITE_CLOUDINARY_CLOUD=your_cloudinary_cloud_name
   VITE_CLOUDINARY_PRESET=your_unsigned_upload_preset
   ```

   Use a valid model name supported by the Gemini API and configured for the project. Keep secret credentials private and never commit the `.env` file to GitHub.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

The Vite development server proxies API requests to the local Express server.

## Demo Guide

1. Register an account as an **older adult** and obtain the account-linking code from the profile page.
2. Register a separate **caregiver** account and use the code to link the accounts.
3. Log in as the older adult and explore health check-ins, medication records, meal-photo analysis, and dose video uploads.
4. Log in as the caregiver to view the linked older adult's information, manage medication records, review dose videos, and leave notes.
5. Explore the chatbot, SOS feature, appointment management, and other available screens.

Some integrations require valid environment variables and configured external services to work correctly.

## Deployment

The application includes a Vercel configuration for frontend and API routing.

1. Push the project repository to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables in the Vercel project settings.
4. Deploy the application.
5. Check the `/api/health` endpoint on the deployed application to verify that the API responds.

For example: `https://your-app.vercel.app/api/health`

## Project Structure

```text
api/
  index.js                 Vercel API entry point

server/
  app.js                   Express application setup
  ai.js                    Gemini integration and AI prompts
  auth.js                  Authentication and access control
  db.js                    MongoDB connection
  models.js                Database models
  routes/                  Feature-specific API routes

src/
  App.jsx                  Application navigation
  api.js                   API requests and media upload helpers
  auth.jsx                 Authentication context
  medicineOcr.js           Medicine-label OCR processing
  pages/                   Application screens
  components/              Shared interface components
  data/
    videos.js              Wellness video metadata
  styles.css               Application styling

postman/
  care-aide.postman_collection.json
                            API testing collection
```

## Security and Medical Safety

- Passwords are hashed using `bcryptjs`.
- JWT authentication and role-based checks help restrict access to linked accounts.
- API keys and other secrets should be configured through environment variables rather than committed to the repository.
- AI-generated nutritional values are estimates and may not be accurate.
- OCR results are extracted text and may contain recognition errors. Medication details must be checked against the original label.
- Cakna is intended for general health support, not medical diagnosis or treatment. Users should seek professional medical advice when needed and contact emergency services for urgent symptoms.
- Health records and uploaded videos may contain sensitive information. Access permissions, user consent, and appropriate data protection practices are important.

## Team

**Team Name:** Clover
**Project Name:** Cakna — Rakan Sihat

Cakna aims to make everyday health management more accessible for older adults while giving caregivers a clearer view of the well-being of the people they support.
