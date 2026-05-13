# ChatApp BE NestJS

This serves as the backend for the [ChatApp FE React](https://github.com/pyroblazer/chatapp-fe-react) project.

## Installation & Setup

### Prerequisites

- Node.js v16
  - Note: Compatibility issues were encountered with Node.js v18, leading to database connection problems. To resolve, please use Node.js v16 if any database connection issues arise.
- MySQL Server (or any SQL database supported by TypeORM).

### Backend Setup

1. Clone the repository.
2. Execute `yarn install` to install the necessary dependencies.
3. Create a `.env.development` file in the root directory and add the following configuration:

   ```env
   PORT=

   MYSQL_DB_HOST=
   MYSQL_DB_USERNAME=
   MYSQL_DB_PASSWORD=
   MYSQL_DB_PORT=
   MYSQL_DB_NAME=

   COOKIE_SECRET=
   ```

   - **`PORT`**: The server port.
   - **`MYSQL_DB_HOST`**: MySQL database server hostname.
   - **`MYSQL_DB_USERNAME`**: MySQL database username.
   - **`MYSQL_DB_PASSWORD`**: Password for the MySQL user account.
   - **`MYSQL_DB_PORT`**: MySQL server port (default 3306).
   - **`MYSQL_DB_NAME`**: Name of your database (ensure it's created before starting the server).
   - **`COOKIE_SECRET`**: Any string for cookie encryption/decryption.

4. Run `yarn start:dev` or `npm run start:dev` (depending on your package manager) to launch the project in development mode.
