import { CheckCircle2, Sparkles } from 'lucide-react';
import { BrandMark } from '../../../components/ui/BrandMark/BrandMark.js';
import { LoginPanel } from '../components/LoginPanel.js';

const benefits = [
  'Jedno místo pro každodenní agendu',
  'Přístup oddělený podle domácnosti',
  'Žádná hesla uložená v HomeApp',
] as const;

export function LoginPage() {
  return (
    <main className="aurora-login-background relative min-h-screen overflow-hidden bg-canvas lg:grid lg:grid-cols-[minmax(22rem,1fr)_minmax(28rem,0.9fr)]">
      <section className="relative hidden min-h-screen border-r border-border px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-16">
        <div className="relative z-10">
          <BrandMark />
          <p className="mt-16 inline-flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.12em] text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            HomeApp Aurora
          </p>
          <h2 className="mt-5 max-w-xl text-display font-semibold tracking-[-0.035em] text-text">
            Domácí úkoly, ve kterých máte jasno.
          </h2>
          <p className="mt-5 max-w-lg text-body leading-7 text-text-muted">
            Bezpečné centrum pro dokumenty, finance, majetek a termíny, které
            poroste spolu s vaší domácností.
          </p>
        </div>
        <ul className="relative z-10 mt-12 space-y-4">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-3 text-body-sm text-text-secondary"
            >
              <CheckCircle2
                className="size-5 text-primary"
                aria-hidden="true"
              />
              {benefit}
            </li>
          ))}
        </ul>
      </section>
      <section className="relative z-10 grid min-h-screen place-items-center px-4 py-8 sm:px-8 lg:min-h-0 lg:px-10">
        <LoginPanel />
      </section>
    </main>
  );
}
