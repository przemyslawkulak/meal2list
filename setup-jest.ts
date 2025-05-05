import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import '@testing-library/jest-dom';

setupZoneTestEnv();

// Mock modules for testing
jest.mock('@app/app.config', () => ({
  AppEnvironment: {},
  mockEnvironment: {
    production: false,
    supabaseUrl: 'https://mock-supabase-url.com',
    supabaseKey: 'mock-supabase-key',
  },
}));

// Mock Supabase database types
jest.mock('@db/database.types', () => ({
  Database: {},
}));

// Create a mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      then: jest
        .fn()
        .mockImplementation(callback => Promise.resolve(callback({ data: [], error: null }))),
    })),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(),
      signInWithOtp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      admin: {
        listUsers: jest.fn().mockResolvedValue({ data: [], error: null }),
      },
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        download: jest.fn(),
        getPublicUrl: jest.fn(),
      }),
    },
  })),
}));

// Global mocks for JSDOM
Object.defineProperty(window, 'CSS', { value: null });
Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>',
});
Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    return {
      display: 'none',
      appearance: ['-webkit-appearance'],
      getPropertyValue: () => '',
    };
  },
});

Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true,
    };
  },
});
