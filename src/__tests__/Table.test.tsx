import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Table, resolveSizeLabel } from '../renderer/Table';

const mockProps = {
  name: 'testName',
  type: 'testType',
  size: 10000,
  lastModified: new Date(),
};

describe('Table', () => {
  it('should render', () => {
    expect(render(<Table data={[mockProps]} />)).toBeTruthy();
  });

  it('should display the data', () => {
    render(<Table data={[mockProps]} />);
    const typeCell = screen.queryByText(/testType/i);
    const nameCell = screen.queryByText(/testName/i);
    const sizeCell = screen.queryByText(/9 KB/i);
    expect(typeCell).toBeVisible();
    expect(nameCell).toBeVisible();
    expect(sizeCell).toBeVisible();
  });
});

describe('resolveSizeLabel', () => {
  it('should resolve bytes correctly', () => {
    expect(resolveSizeLabel(100)).toEqual('100 B');
  });

  it('should resolve kilobytes correctly', () => {
    expect(resolveSizeLabel(10000)).toEqual('9 KB');
  });

  it('should resolve megabytes correctly', () => {
    expect(resolveSizeLabel(10000000)).toEqual('9 MB');
  });

  it('should resolve gigabytes correctly', () => {
    expect(resolveSizeLabel(10000000000)).toEqual('9 GB');
  });

  it('should resolve terabytes correctly', () => {
    expect(resolveSizeLabel(10000000000000)).toEqual('9 TB');
  });
});
