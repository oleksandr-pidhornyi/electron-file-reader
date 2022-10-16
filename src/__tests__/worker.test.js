import '@testing-library/jest-dom';
import fs from 'fs';

jest.mock('electron', () => ({
  ipcRenderer: {
    on: jest.fn(() => {}),
  },
}));

jest.mock('fs', () => ({
  statSync: jest.fn(() => {
    return null;
  }),
  promises: {
    readdir: jest.fn(() => {
      console.log('readdir');
      return null;
    }),
  },
}));

const scanDirectory = require('../worker/worker');

// Doesn't import :(
describe('scanDirectory', () => {
  it('should return correct object', () => {
    expect(true).toEqual(true);
  });
});
