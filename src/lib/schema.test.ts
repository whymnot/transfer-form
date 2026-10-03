import { describe, it, expect } from 'vitest';
import { transferSchema } from './schema';

const valid = {
  fromAccount: 'acc-1',
  cardNumber: '8600123412341234',
  amount: 100_000,
};

describe('transferSchema', () => {
  it('валидные данные проходят', () => {
    expect(transferSchema.safeParse(valid).success).toBe(true);
  });

  it('номер карты из 15 цифр не проходит', () => {
    const result = transferSchema.safeParse({ ...valid, cardNumber: '860012341234123' });
    expect(result.success).toBe(false);
  });

  it('отрицательная сумма не проходит', () => {
    const result = transferSchema.safeParse({ ...valid, amount: -100 });
    expect(result.success).toBe(false);
  });
});