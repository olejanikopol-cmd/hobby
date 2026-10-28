'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { safeNext } from '@/lib/nav';
import { actions, useAppState } from '@/lib/store';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const { interests } = useAppState();
  const [step, setStep] = useState<'start' | 'code'>('start');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const finish = (name: string, mail: string) => {
    actions.signIn(name, mail);
    router.push(interests.length ? next : `/onboarding?next=${encodeURIComponent(next)}`);
  };

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Перевірте адресу пошти');
      return;
    }
    setError(null);
    setStep('code');
    setTimeout(() => codeRef.current?.focus(), 50);
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Введіть 6 цифр');
      return;
    }
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    finish(name || 'Гість', email.trim());
  };

  return (
    <div className="flex w-full max-w-[420px] animate-rise flex-col gap-4 rounded-section bg-white p-6 shadow-card sm:p-8">
      {step === 'start' ? (
        <>
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="font-logo text-xl font-extrabold tracking-[-0.04em]">hobbyl</span>
          </div>
          <h1 className="font-head text-3xl leading-tight font-extrabold">Увійди, щоб записуватися</h1>
          <p className="text-[15px] text-muted">Один акаунт — і для участі, і для ведення занять.</p>
          <p className="rounded-control bg-amber-soft px-3 py-2 text-sm text-amber-ink">
            Демо-режим: вхід без перевірки, дані зберігаються лише у вашому браузері.
          </p>
          <button type="button" onClick={() => finish('Гість Google', 'google@demo.hobbyl')} className="btn-ghost h-[52px] text-base">
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink text-xs font-extrabold">G</span>
            Продовжити з Google
          </button>
          <button type="button" onClick={() => finish('Гість Telegram', 'telegram@demo.hobbyl')} className="btn-ghost h-[52px] text-base">
            <Icon name="telegram" />
            Увійти через Telegram
          </button>
          <div aria-hidden="true" className="flex items-center gap-3 text-[13px] text-muted">
            <span className="h-px flex-1 bg-line" />
            або поштою
            <span className="h-px flex-1 bg-line" />
          </div>
          <form onSubmit={sendCode} className="flex flex-col gap-3" noValidate>
            <label className="label">
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" className="field h-[52px]" />
            </label>
            {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
            <button type="submit" className="btn-primary h-[52px] text-base font-extrabold">Отримати код</button>
          </form>
          <p className="text-center text-xs leading-normal text-muted">
            Продовжуючи, ви погоджуєтеся з <Link href="/legal" className="text-brand underline">Правилами</Link> та{' '}
            <Link href="/legal?tab=privacy" className="text-brand underline">Політикою конфіденційності</Link>.
          </p>
        </>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-4" noValidate>
          <button
            type="button"
            onClick={() => {
              setStep('start');
              setError(null);
            }}
            aria-label="Назад"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-chip"
          >
            <Icon name="chevronLeft" />
          </button>
          <h1 className="font-head text-3xl font-extrabold">Введи код</h1>
          <p className="text-[15px] text-muted">
            Ми надіслали б 6 цифр на <b className="text-ink">{email}</b>. У демо-режимі підходить будь-який код, наприклад 123456.
          </p>
          <input
            ref={codeRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-label="Код з листа"
            placeholder="••••••"
            className="field h-16 text-center font-head text-3xl tracking-[0.5em]"
          />
          {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
          <button type="submit" className="btn-primary h-[52px] text-base font-extrabold">Підтвердити</button>
        </form>
      )}
    </div>
  );
}
