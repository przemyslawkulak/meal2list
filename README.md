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
- [Project Roadmap](#project-roadmap)

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

## Project Roadmap

The following outlines the planned development phases and key features for Meal2List. Check off items as they are completed:

### Phase 0: Immediate User Experience (UX) Enhancements

- ✅ **Mobile Views & Navigation Improvements:** Ensure the application is fully responsive and intuitive to use on mobile devices, enhancing overall accessibility and ease of navigation.

### Phase 1: Strengthening Core Functionality & Data Foundation

- ✅ **Standardized Product Database:** Implement a standardized list of products in the database, with the ability for users or administrators to add new items. This will improve data consistency and categorization.
- ✅ **Standardized Quantities:** Introduce standardized units of measurement (e.g., pieces, grams, ml) to replace ambiguous terms like "pinches" or "cups," ensuring clarity and enabling better product management.
- ✅ **AI Generation Review Screen:** Develop an intermediary screen after AI-based ingredient extraction. This will allow users to review, edit quantities/units, and exclude items (especially common household staples like spices, oil) before they are added to the shopping list.
- ✅ **Recipe Source Tracking:** Implement recipe name tracking throughout the shopping list lifecycle. Track which recipe generated each product, display recipe source in shopping lists, and add visual grouping/filtering by recipe functionality.
- ✅ **Shopping List Item Editing:** Implement comprehensive editing capabilities for shopping list items, including modifying quantities, units, product names, categories, and the ability to mark items as completed or remove them entirely.
- ✅ **Recipe Import from URL:** Develop a feature to scrape recipe details directly from a provided website URL, automatically populating the ingredient extraction field.
- 🔄 **Production Readiness:** Complete final production preparation including UI/UX polish, security hardening, comprehensive error handling, landing page creation, code cleanup and optimization, and performance caching implementation.
- [ ] **User-Specific Generation Limits:** Introduce a system to manage API usage, such as a weekly limit on the number of recipes a user can process for ingredient extraction (e.g., 10 recipes per week).

### Phase 2: Further UX Enhancements & Operational Needs

- [ ] **Receipt Image Processing:** Implement OCR functionality to extract shopping list items directly from receipt images, allowing users to quickly recreate past shopping lists or track spending patterns.
- [ ] **Recipe Saving & Quick-Add:** Enhance the recipe saving feature to allow users to easily select a saved recipe to automatically generate a shopping list, streamlining the process.
- [ ] **Vector Database Integration (Qdrant):** Implement Qdrant vector database for semantic product matching and improved AI-driven ingredient recognition, enabling better fuzzy matching and product suggestions.
- [ ] **AI Product Matching Integration:** Integrate product matching into AI workflow to automatically connect AI-generated product names to existing database products, improving data consistency and reducing duplicate entries.
- [ ] **AI Caching System:** Implement intelligent caching for AI-generated responses to reduce API costs and improve response times, including cache warming for common operations and smart invalidation strategies.

### Phase 3: Expanding Scope (Post-MVP Features)

- [ ] **Product Combination:** Implement logic to combine identical products on the shopping list, even if added from different sources or with different initial units (e.g., "2 tomatoes" manually added + "500g tomatoes" from a recipe should intelligently merge).
- [ ] **Recipe Cataloging & Tagging:** Allow users to organize their saved recipes with categories or tags for easier browsing and retrieval.
- [ ] **Social Features:** Implement social functionalities such as sharing recipes and shopping lists, potentially with collaborative features and notifications.
- [ ] **Recipe Calendar/Meal Planning:** Introduce a calendar feature to help users plan their meals by assigning recipes to specific dates.
- [ ] **Rich Multimedia Support:** Integrate support for images or other multimedia content related to recipes (e.g., dish photos, user uploads).
- [ ] **Gamification:** Introduce gamification elements (e.g., points, badges, challenges) to enhance user engagement and motivation.

## Project Status

The project is in the MVP stage and under active development.

## License

This project is licensed under the MIT License.
