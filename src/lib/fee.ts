export const FEE_RATE = 0.01;

export function calcFee(amount: number) {
    return Math.round(amount * FEE_RATE);
}