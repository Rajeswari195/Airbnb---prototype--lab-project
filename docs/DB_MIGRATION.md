# Database Migration: MySQL to MongoDB

## Overview
In Lab 2, we migrated the entire data persistence layer from MySQL to MongoDB. This decision was driven by the need for a more flexible, scalable, and document-oriented database for our distributed system.

## Changes
1.  **Removed MySQL Dependencies**: `mysql2` and `express-mysql-session` were removed from all backend services.
2.  **Added MongoDB Dependencies**: `mongoose` and `connect-mongo` were added.
3.  **Mongoose Models**:
    - `User`: Stores user profiles, roles (traveler/owner), and hashed passwords.
    - `Property`: Stores property details, amenities, and photos.
    - `Booking`: Stores booking requests, status, and dates.
    - `Favorite`: Stores user favorites.
    - `AnalyticsEvent`: Stores clickstream data.
4.  **Session Management**: Express sessions are now stored in MongoDB using `connect-mongo`.

## Migration Steps
1.  Ensure MongoDB is running (e.g., via Docker).
2.  Update `.env` with `MONGO_URI`.
3.  Start backend services; they will automatically connect to MongoDB.
4.  (Optional) If you have legacy MySQL data, you would need to write a script to export from MySQL and import into MongoDB. For this prototype, we start fresh.

## Verification
- Check logs for "Connected to MongoDB".
- Use `mongosh` or Compass to verify collections are created (`users`, `properties`, `bookings`, `sessions`, `analyticsevents`).
