'use client';

import { useEffect, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@ui/components/button';

import { useApplication } from '@/lib/api/queries';

export function ConfirmationStep({ code }: { code: string }) {
  const t = useTranslations('apply.confirmation');
  const pathname = usePathname();
  const router = useRouter();
  // Keep `/t/:code/` if we landed here via the shared-host path so the track
  // link the parent will share carries the tenant.
  const tenantMatch = pathname.match(/^(\/t\/[^/]+)\//);
  const trackPrefix = tenantMatch?.[1] ?? '';
  const homeHref = (trackPrefix || '/') as Route;

  // The submission is final once the parent reaches this screen — letting
  // them browser-back into the form would let them tweak fields (e.g. swap
  // the student photo) and resubmit against the same draft, creating
  // duplicate / inconsistent applications. We push a sentinel history entry
  // and on the next back press redirect to the tenant landing instead.
  useEffect(() => {
    window.history.pushState({ confirmationGuard: true }, '');
    const onPopState = () => {
      router.replace(homeHref);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [router, homeHref]);
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

  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    try {
      // navigator.clipboard requires a secure context (https or localhost);
      // fall back to a hidden textarea + execCommand on stricter mobile
      // browsers where the modern API is unavailable.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success(t('copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('copyFailed'));
    }
  };

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

      <div className="flex flex-col items-center gap-2">
        <p className="bg-gradient-to-r from-primary via-primary to-primary/55 bg-clip-text font-display text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
          {code}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={copyCode}
          className="gap-1.5 text-xs"
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {t('copyCta')}
        </Button>
      </div>

      <Button size="lg" className="w-full max-w-xs" asChild>
        <Link href={`${trackPrefix}/track/${code}` as Route}>{t('trackCta')}</Link>
      </Button>
    </div>
  );
}
