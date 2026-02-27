// Jest mock for firebase.ts to avoid real Firebase initialization in tests
export const db = {};
export const auth = {};
export const storage = {};

// Dummy test to satisfy Jest
it('dummy test', () => {
  expect(true).toBe(true);
});
