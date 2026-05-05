import { beforeAll, afterAll } from "vitest";

// This file runs before all tests to set up the database
// Tests expect 'npm run dev' running in the background with DATABASE_URL pointing to test DB

beforeAll(async () => {
  // Connect to test database would be set up here in a real project
  // For now, tests assume the app server is running
  console.log("🧪 Test setup complete");
});

afterAll(async () => {
  console.log("🧪 Test teardown complete");
});
