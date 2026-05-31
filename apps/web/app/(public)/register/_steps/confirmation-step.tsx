'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@ui/components/button';

import { useApplication } from '@/lib/api/queries';

export function ConfirmationStep({ code }: { code: string }) {
  const t = useTranslations('apply.confirmation');
  const { data: application } = useApplication(code);
  const applicant = application?.applicant;
  const parentName = applicant?.fullName;
  // Honorific from the declarant relationship: bố → Ông, mẹ → Bà. Other
  // relationships (guardian/self) carry no inferable gender, so omit it.
  const honorific =
    applicant?.relationship === 'father'
      ? t('honorific.male')
      : applicant?.relationship === 'mother'
        ? t('honorific.female')
        : '';
  const displayName = parentName
    ? [honorific, parentName].filter(Boolean).join(' ')
    : '';

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-9" aria-hidden />
      </span>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {displayName
            ? t.rich('greeting', {
                name: displayName,
                hl: (chunks) => (
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text font-semibold text-transparent">
                    {chunks}
                  </span>
                ),
              })
            : t('greetingNoName')}
        </h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{t('await')}</p>
      </div>

      <div className="space-y-1.5">
        <p className="bg-gradient-to-r from-primary via-primary to-primary/55 bg-clip-text font-display text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
          {code}
        </p>
      </div>

      <Button size="lg" className="w-full max-w-xs" asChild>
        <Link href={`/track/${code}` as Route}>{t('trackCta')}</Link>
      </Button>
    </div>
  );
}
