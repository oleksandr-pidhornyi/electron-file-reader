import { render } from '@testing-library/react';
import React, { MouseEventHandler } from 'react';
import './App.css';

const SIZE_LABELS = ['B', 'KB', 'MB', 'GB', 'TB'];

type Item = {
  name: string;
  type: string;
  size: number;
  lastModified: Date;
};

interface IProps {
  data: Item[];
}

export function resolveSizeLabel(size: number | undefined) {
  if (!size) return '...';
  let sizeLabel = 0;
  let newSize = size;
  const denominator = 1024;
  while (newSize > denominator) {
    sizeLabel += 1;
    newSize /= denominator;
  }
  const res = `${Math.floor(newSize)} ${SIZE_LABELS[sizeLabel]}`;
  return res;
}

export function Table(props: IProps) {
  const { data } = props;
  return !data ? null : (
    <tbody>
      {data.map((item) => {
        return (
          <tr key={item.name}>
            <td>{item.type}</td>
            <td>{item.name}</td>
            <td>{resolveSizeLabel(item.size)}</td>
            <td>{item.lastModified?.toLocaleDateString()}</td>
          </tr>
        );
      })}
    </tbody>
  );
}
