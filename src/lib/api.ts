import { calcFee } from './fee';

export const ACCOUNTS = [
  { id: 'acc-1', name: 'Основной счёт', balance: 5_000_000 },
  { id: 'acc-2', name: 'Накопительный', balance: 20_000_000 },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function submitTransfer(accountId: string, amount: number) {
  await wait(800);
  const acc = ACCOUNTS.find((a) => a.id === accountId);
  if (!acc) throw new Error('Счёт не найден');
  if (amount + calcFee(amount) > acc.balance) throw new Error('Недостаточно средств на счёте');
}

export async function verifyOtp(code: string) {
  await wait(600);
  if (code !== '1234') throw new Error('Неверный код (подсказка: 1234)');
}