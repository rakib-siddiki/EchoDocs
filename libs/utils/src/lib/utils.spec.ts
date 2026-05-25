import { cn } from './utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('bg-red-500', 'text-white')).toEqual('bg-red-500 text-white');
  });

  it('should merge tailwind classes properly', () => {
    expect(cn('px-2 py-1', 'p-4')).toEqual('p-4');
  });
});
