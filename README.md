````markdown
# Matomo User Monitoring POC

A Proof of Concept for monitoring and tracking user activity in a web application using Matomo On-Premise.

## Overview

This project demonstrates how Matomo can be integrated with a web application to track authenticated users and their activities.

The POC includes:

- User authentication using JWT
- User identification using User ID
- Matomo page-view tracking
- Application activity/event tracking
- Login and logout tracking
- Equipment create, update and delete activity tracking
- Recently active user monitoring
- Multiple-user tracking
- User activity history with date filtering
- Superadmin monitoring dashboard

## Architecture

```text
User
  |
  v
Web Application
  |
  | JWT Authentication
  v
Backend
  |
  | Activity + User ID
  v
Matomo
  |
  v
Matomo Database
  |
  v
Superadmin Dashboard
```
## Technologies Used

* Node.js
* Express.js
* SQLite
* JWT
* Matomo On-Premise
* HTML
* CSS
* JavaScript
* Matomo Tracking API

## Project Structure

```text
matomo-monitoring-poc/
│
├── database.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
├── README.md
│
└── public/
    ├── login.html
    ├── dashboard.html
    ├── admin.html
    └── style.css
```

## Features

### Authentication

Users log in using their username and password. The backend authenticates the user and generates a JWT access token containing the authenticated user's information.

### Activity Tracking

The application tracks activities such as:

* User logged in
* User logged out
* Equipment created
* Equipment updated
* Equipment deleted
* Page views

Activities are associated with the authenticated user's ID.

### Superadmin Monitoring

The admin dashboard provides:

* Recently active users
* Latest activity
* Matomo user details
* User activity history
* Date-based activity filtering

## Running the Project

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
node server.js
```

### 3. Open the Application

```text
http://localhost:3003/login.html
```

## Matomo Configuration

This POC uses a local Matomo instance.

The Matomo server URL and authentication token should be configured locally and should not be committed to GitHub.

## Important Note

This is a learning and feasibility POC. The authentication, database, and activity tracking implementations are simplified for demonstration purposes and should be adapted and secured before use in a production environment.







