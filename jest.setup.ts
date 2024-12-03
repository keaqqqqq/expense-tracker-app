import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

declare global {
  interface JestMatchers<R> {
    toBeInTheDocument(): R;
  }
}

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});


afterEach(() => {
  jest.clearAllMocks();
});
