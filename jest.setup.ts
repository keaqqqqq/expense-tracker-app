import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

declare global {
  interface JestMatchers<R> {
    toBeInTheDocument(): R;
  }
}

beforeEach(() => {
  // eslint-disable-next-line
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
});
