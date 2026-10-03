import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transferSchema, type TransferData } from '../lib/schema';
import { ACCOUNTS, submitTransfer, verifyOtp } from '../lib/api';
import { calcFee } from '../lib/fee';

const STEPS = ['Счёт и получатель', 'Сумма', 'Подтверждение', 'Код из SMS'];
const FIELDS: (keyof TransferData)[][] = [
  ['fromAccount', 'cardNumber'],
  ['amount', 'comment'],
];
const MAX_ATTEMPTS = 3;

export function TransferWizard() {
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const locked = attempts >= MAX_ATTEMPTS;

  const {
    register,
    control,
    reset,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<TransferData>({
    resolver: zodResolver(transferSchema),
    mode: 'onTouched',
    defaultValues: { fromAccount: '', cardNumber: '', comment: '' },
  });

  const next = async () => {
    const ok = step > 1 || (await trigger(FIELDS[step]));
    if (ok) setStep((s) => s + 1);
  };

  const run = async (action: () => Promise<void>) => {
    setError('');
    setLoading(true);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const confirm = () =>
    run(async () => {
      const { fromAccount, amount } = getValues();
      await submitTransfer(fromAccount, amount);
      setStep(3);
    });

  const checkOtp = () =>
    run(async () => {
      try {
        await verifyOtp(otp);
      } catch (e) {
        setAttempts((a) => a + 1);
        setOtp('');
        throw e;
      }
      setDone(true);
    });

  const startOver = () => {
    reset();
    setStep(0);
    setOtp('');
    setError('');
    setAttempts(0);
    setDone(false);
  };

  const v = getValues();

  if (done) {
    return (
      <div className="card">
        <h2>Перевод выполнен ✅</h2>
        <p>
          {v.amount.toLocaleString('ru-RU')} → карта •••• {v.cardNumber.slice(-4)}
        </p>
        <button onClick={startOver}>Новый перевод</button>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="muted">
        Шаг {step + 1} из {STEPS.length}: {STEPS[step]}
      </p>

      {step === 0 && (
        <>
          <label>
            Счёт списания
            <select {...register('fromAccount')}>
              <option value="">Выберите…</option>
              {ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.balance.toLocaleString('ru-RU')}
                </option>
              ))}
            </select>
            {errors.fromAccount && <span className="error">{errors.fromAccount.message}</span>}
          </label>
          <label>
            Номер карты получателя
            <input
              {...register('cardNumber', {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16);
                },
              })}
              inputMode="numeric"
              placeholder="8600123412341234"
            />
            {errors.cardNumber && <span className="error">{errors.cardNumber.message}</span>}
          </label>
        </>
      )}

      {step === 1 && (
        <>
          <label>
            Сумма
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <input
                  inputMode="numeric"
                  placeholder="10 000"
                  value={
                    field.value == null || Number.isNaN(field.value)
                      ? ''
                      : field.value.toLocaleString('ru-RU')
                  }
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                    field.onChange(digits ? Number(digits) : NaN);
                  }}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.amount && <span className="error">{errors.amount.message}</span>}
          </label>
          <label>
            Комментарий
            <input {...register('comment')} />
            {errors.comment && <span className="error">{errors.comment.message}</span>}
          </label>
        </>
      )}

      {step === 2 && (
        <ul>
          <li>Счёт: {ACCOUNTS.find((a) => a.id === v.fromAccount)?.name}</li>
          <li>Карта: •••• {v.cardNumber.slice(-4)}</li>
          <li>Сумма: {v.amount.toLocaleString('ru-RU')}</li>
          <li>Комиссия: {calcFee(v.amount).toLocaleString('ru-RU')}</li>
          <li>Итого к списанию: {(v.amount + calcFee(v.amount)).toLocaleString('ru-RU')}</li>
          {v.comment && <li>Комментарий: {v.comment}</li>}
        </ul>
      )}

      {step === 3 && (
        <label>
          Код из SMS
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="1234"
            disabled={locked}
          />
        </label>
      )}

      {error && !locked && <p className="error">{error}</p>}
      {locked && <p className="error">Слишком много попыток. Перевод заблокирован.</p>}

      <div className="buttons">
        {step > 0 && step < 3 && <button onClick={() => setStep((s) => s - 1)}>Назад</button>}
        {step < 2 && <button onClick={next}>Далее</button>}
        {step === 2 && (
          <button onClick={confirm} disabled={loading}>
            {loading ? 'Отправка…' : 'Подтвердить'}
          </button>
        )}
        {step === 3 && !locked && (
          <button onClick={checkOtp} disabled={loading || otp.length < 4}>
            {loading ? 'Проверка…' : 'Отправить'}
          </button>
        )}
        {step === 3 && locked && <button onClick={startOver}>Начать заново</button>}
      </div>
    </div>
  );
}