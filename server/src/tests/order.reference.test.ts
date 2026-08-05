import assert from 'node:assert/strict';
import test from 'node:test';

import { generateOrderReference } from '@src/utils/orderReference';

test('generateOrderReference creates FO-YYMMDD-XXXXXX style ids', () => {
  const reference = generateOrderReference(new Date('2026-08-05T10:00:00.000Z'));
  assert.match(reference, /^FO-260805-[A-F0-9]{6}$/);
});

test('generateOrderReference values are unique across calls', () => {
  const first = generateOrderReference();
  const second = generateOrderReference();
  assert.notEqual(first, second);
});
