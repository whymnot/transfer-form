import { describe, it, expect } from 'vitest';
import { calcFee } from './fee';

describe('calcFee', () => {
    it('комиссия с 100 000 равна 1 000', () => {
        expect(calcFee(100_000)).toBe(1_000);
    });
    it('комиссия с 0 равна 0', () => {
        expect(calcFee(0)).toBe(0);
    });
});