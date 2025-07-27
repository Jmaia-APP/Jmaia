# Jmaia - Financial Circle Web Application

## Project Overview

FundCircleApp is a web application inspired by Money Fellows that enables users to create, join, and manage rotating savings circles. This repository contains both the backend (Node.js/Express) and the frontend (static HTML/CSS/Tailwind V3/JS).

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Environment Variables](#environment-variables)
6. [Backend Structure](#backend-structure)
7. [Frontend Structure](#frontend-structure)
8. [API Endpoints](#api-endpoints)
9. [Authentication](#authentication)
10. [Usage](#usage)
11. [Testing](#testing)
12. [Contribution Guidelines](#contribution-guidelines)
13. [Database Schema](#database-schema)
14. [Future Improvements](#future-improvements)
15. [License](#license)

---

## Features

* **User Registration & Login**: Secure sign-up and sign-in flows.
* **JWT Authentication**: Token-based authentication for API endpoints.
* **Circle Management**: Create, join, and monitor saving circles.
* **Online Payments**: Simulate payment workflows within circles.
* **Profile Dashboard**: View personal details, circle participation, and payment status.

## Tech Stack

* **Frontend:** Static HTML, CSS (Tailwind CSS), Vanilla JavaScript
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (via `pg` package)
* **Authentication:** JSON Web Token (JWT), bcryptjs
* **Configuration:** dotenv
* **Version Control:** Git

## Prerequisites

* **Node.js** v14 or higher
* **npm** or **yarn**
* **PostgreSQL** 12 or higher

## Installation

1. **Clone repository**

   ```bash
   git clone https://github.com/Jmaia-APP/Jmaia.git
   cd Jmaia
   ```
2. **Install backend dependencies**

   ```bash
   npm install
   ```
3. **Set up PostgreSQL database**

   * Create database `fundcircle_db`.
   * (Optional) Run migrations: `npm run migrate`
4. **Install frontend dependencies**

   ```bash
   cd frontend    # if frontend is a separate folder, else skip
   npm install
   ```
5. **Configure `.env`** (see [Environment Variables](#environment-variables)).
6. **Start servers**

   ```bash
   npm run dev   # runs backend and watches frontend
   ```

## Environment Variables

```dotenv
PORT=5500
DATABASE_URL=postgres://<username>:<password>@<host>:5432/fundcircle_db
JWT_SECRET=your_jwt_secret_key
```

---

## Backend Structure

```
Money
├── config/
│   ├── config.js
│   └── db.js
├── jobs/
│   └── cron.js
├── middleware/
│   ├── admin.js
│   └── auth.js
├── models/
│   ├── association.js
│   ├── index.js
│   ├── notification.js
│   ├── payment.js
│   ├── turn.js
│   └── user.js
├── nationalID/
│   └── (الملفات المتعلقة بالهوية الوطنية)
├── routes/
│   ├── associations.js
│   ├── auth.js
│   ├── nationalID.js
│   ├── payments.js
│   └── turns.js
├── seeding/
│   └── seeding.js
├── services/
│   ├── associationService.js
│   ├── feeService.js
│   ├── paymentService.js
│   ├── roscaService.js
│   ├── turnService.js
│   └── userService.js
├── tests/
│   ├── .env
│   ├── create_associations.js
│   ├── create_users.js
│   ├── dummy_profile.png
│   ├── dummy_salary.png
│   ├── run_payout_test.js
│   ├── test-cron.js
│   ├── test-turn-fee.js
│   └── testcyle.js
├── .gitignore
├── Dockerfile
├── README.md
├── app.js
├── docker-compose.yml
├── e2e-test.js
├── package-lock.json
├── package.json
└── postman_collection.json
              # Documentation
```

---

## Frontend Structure

```
FundCircleApp/
├── .git/                    # Git metadata
├── .vscode/                 # VSCode settings
├── node_modules/            # npm dependencies (e.g., Tailwind)
├── dist/                    # Built frontend assets (HTML/CSS/JS)
├── Assets/                  # Images, icons, fonts
├── dashboard/               # Dashboard page assets (Admin Panel)
    ├── dashboard.html
    ├── dashboard.js
    ├── index.html           # login (Admin)
├── api/                     # Frontend helpers for API calls
├── public/                  # (alternative folder for HTML files)
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.js       # Tailwind configuration
├── package.json             # Frontend dependencies & scripts
├── package-lock.json        # Dependency lock file
└── [HTML pages]
    ├── about.html
    ├── arrive.html
    ├── assembly_contract.html
    ├── assembly_summary.html
    ├── association_amount.html
    ├── association_card.html
    ├── asso_confirmJoin.html
    ├── asso_register.html
    ├── circle-list.html
    ├── confirm_code.html
    ├── Electronic_wallet.html
    ├── fire.html
    ├── guide.html
    ├── help.html
    ├── home.html
    ├── iban_account.html
    ├── index.html             # Entry / landing page
    ├── join.html
    ├── join_association.html
    ├── login.html
    ├── mainLayout.html
    ├── National_id.html
    ├── Notification.html
    ├── Paid-card.html
    ├── Paid-card_copy.html
    ├── payments.html
    ├── payments_static.html
    ├── payments-settings.html
    ├── payments-policy.html
    ├── phone_number.html
    ├── postcss.config.js     # Recognized as HTML extension by editor
    ├── privacy.html
    ├── profile.html
    ├── Receiving_system.html
    ├── register.html
    ├── select_amount.html
    ├── select_turn.html
    ├── splash.html
    ├── terms.html
    ├── Tahwish-Association.html
    ├── upload.html
    └── wallet.html
```

### Frontend Build & Tailwind

* Source files (in `dist/` or root) are built via:

  ```bash
  npm run build:css
  ```
* Tailwind configured in `tailwind.config.js` and `postcss.config.js`.
* Output goes to `dist/css/output.css` and `dist/js/bundle.js`.

### Frontend Scripts

Inside `dist/js/` or inline `<script>` tags you will find:

* **api/**: Functions to call backend endpoints.
* **dashboard/**: Logic for the dashboard view.
* **auth logic**: Registration/login handling.
* **circle logic**: Fetching and rendering circles and payments.

---

## API Endpoints

| Method | Endpoint         | Description                    |
| ------ | ---------------- | ------------------------------ |
| POST   | `/auth/register` | Register a new user            |
| POST   | `/auth/login`    | Authenticate user & return JWT |
| GET    | `/auth/me`       | Retrieve current user profile  |

(Circle management endpoints to be added)

---

## Authentication

Use `Authorization: Bearer <token>` header for protected requests. Tokens expire after 1 hour.

---

## Usage

1. Register at `/auth/register`.
2. Login at `/auth/login` to obtain a JWT.
3. Place the JWT in `localStorage` and include in API calls via frontend scripts.
4. Open any HTML page (e.g., `dist/index.html`) in the browser.

---

## Testing

Backend tests with Jest & Supertest:

```bash
npm install --save-dev jest supertest
npm test
```

---

## Contribution Guidelines

1. Fork the repo.
2. `git checkout -b feature/your-feature`
3. Make changes & `git commit -m "Add feature"`
4. `git push origin feature/your-feature`
5. Open a Pull Request.

---

## Database Schema

```sql
CREATE TABLE users (...);
CREATE TABLE circles (...);
CREATE TABLE circle_members (...);
CREATE TABLE payments (...);
```

---

## Future Improvements

* Full CRUD endpoints for circles
* Admin roles & dashboard
* Real payment gateway integration
* Email/SMS notifications

---

## License

This project is released under the MIT License.
