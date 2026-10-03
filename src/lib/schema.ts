import { z } from 'zod';

export const transferSchema = z.object({
  fromAccount: z.string().min(1, 'Выберите счёт списания'),
  cardNumber: z.string().regex(/^\d{16}$/, 'Введите 16 цифр номера карты'),
  amount: z
    .number({ error: 'Введите сумму' })
    .positive('Сумма должна быть больше нуля')
    .max(50_000_000, 'Максимум 50 000 000 за один перевод'),
  comment: z.string().max(100, 'Не более 100 символов').optional(),
});

export type TransferData = z.infer<typeof transferSchema>;