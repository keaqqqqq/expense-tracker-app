import '@testing-library/jest-dom';
import { expect, jest } from '@jest/globals';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
});