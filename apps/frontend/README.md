# React ChatApp Frontend

This repository contains the frontend code for the ChatApp project, built using React. For the corresponding backend code, refer to the [ChatApp NestJS repository](https://github.com/pyroblazer/chatapp-be-nestjs).

## Installation

Before running this project locally, ensure that both the React & NestJS projects are set up, along with a SQL database. The current configuration uses MySQL, but you can easily switch to another database like PostgreSQL.

1. Clone this repository and install dependencies.
2. Visit the [Chat Platform NestJS repository](https://github.com/pyroblazer/chatapp-be-nestjs) and follow the provided instructions to set up the backend.
3. Run both projects using the `start:dev` script using your preferred package manager (`npm`, `yarn`, etc.).
4. The main routes include:
   - `/register`: Create an account
   - `/login`: Log in to the app
   - `/conversations`: View and participate in conversations with other users

Please note that there is no landing page, and the specified routes are the primary entry points for users.
