# Meal2List

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Running Supabase Edge Functions Locally](#running-supabase-edge-functions-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Meal2List is a web application designed to simplify the process of creating shopping lists. It automatically generates a list of ingredients from a provided recipe text while also allowing users to manually create and edit their lists. The application supports grouping items by predefined categories and marks each product based on its source (automatic, manually added, or modified). Secure user registration and login ensure that personal shopping lists are safely managed.

## Tech Stack

- **Frontend:** Angular 19, Angular Material, TypeScript 5
- **Backend:** Supabase (PostgreSQL, user authentication)
- **AI Integration:** Openrouter.ai for AI-driven ingredient extraction
- **CI/CD & Hosting:** GitHub Actions, DigitalOcean
- **Code Quality:** ESLint, Prettier, Husky, lint-staged
- **Testing:**
  - **Unit Tests:** Jest for Angular services and components
  - **E2E Tests:** Playwright for browser automation and end-to-end testing

## Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd meal2list
   ```
2. **Ensure you are using the correct Node version: This project uses the Node version specified in the .nvmrc file. Currently it's 22.11.0.**
   If you use nvm, run:
   ```bash
   nvm use
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your OpenAI API key.

5. **Start the development server:**
   ```bash
   npm start
   ```
   The application will be available at [http://localhost:4200](http://localhost:4200).

## Running Supabase Edge Functions Locally

1. **Install Supabase CLI** (if not already installed):

   ```bash
   npm install -g supabase
   ```

2. **Ensure your .env file contains the required API keys:**

   ```plaintext
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start the Edge Functions locally:**

   ```bash
   supabase functions serve --env-file ./.env --no-verify-jwt
   ```

   This will start the Edge Functions server locally, allowing you to test the functions without deploying them.

   The `--no-verify-jwt` flag disables JWT verification for local development. Do not use this flag in production.

## Available Scripts

- `ng`: Angular CLI commands.
- `start`: Runs the development server using `ng serve`.
- `build`: Builds the project for production.
- `watch`: Builds the project in watch mode.
- `test`: Runs the unit tests.
- `serve:ssr:meal2list`: Starts the server-side rendering version using Node.js.
- `lint`: Runs ESLint to check code quality.
- `format`: Formats the codebase using Prettier.
- `format:check`: Checks code formatting.

## Project Scope

Meal2List focuses on simplifying shopping list creation by:

- Automatically extracting ingredients from recipe text.
- Allowing manual creation, editing, and deletion of shopping lists and individual products.
- Grouping products by categories (e.g., dairy, vegetables, fruits, bread).
- Providing secure user registration and login.

**Out of Scope:**

- Importing recipes from URLs.
- Rich multimedia support.
- Social features such as sharing recipes or shopping lists.

## Project Status

The project is in the MVP stage and under active development.

## License

This project is licensed under the MIT License.
