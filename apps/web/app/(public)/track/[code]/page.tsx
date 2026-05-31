'use client';

import { useMemo } from 'react';
import { FileSearch } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';

import { APPLICATION_STATES, type ApplicationState } from '@shared/admission';
import { EmptyState } from '@ui/components/empty-state';
import { ErrorState } from '@ui/components/error-state';
import { Skeleton } from '@ui/components/skeleton';
import { cn } from '@ui/lib/utils';

import { studentNameOf } from '@/lib/api';
import { useApplication } from '@/lib/api/queries';

type TimelineStep = {
  state: ApplicationState;
  at: Date;
  by: string;
  role: string;
  note?: string;
};

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/**
 * Demo state journey (pha-1 mock). Pha 2 reads the real per-application history
 * (state + timestamp + actor) from the API. Anchored to "now" going back so the
 * dates always read as a believable, completed progression for the demo.
 */
function demoTimeline(parentName: string): TimelineStep[] {
  const now = Date.now();
  return [
    {
      state: 'SUBMITTED',
      at: new Date(now - 3 * DAY),
      by: parentName || 'Phụ huynh',
      role: 'Người khai hồ sơ',
    },
    {
      state: 'UNDER_REVIEW',
      at: new Date(now - 2 * DAY),
      by: 'Ban tuyển sinh',
      role: 'Cán bộ xét duyệt',
    },
    {
      state: 'NEEDS_INFO',
      at: new Date(now - DAY),
      by: 'Ban tuyển sinh',
      role: 'Cán bộ xét duyệt',
      note: 'Đề nghị bổ sung ảnh chân dung nền đơn sắc, rõ nét hơn.',
    },
    {
      state: 'APPROVED',
      at: new Date(now - 2 * HOUR),
      by: 'Hội đồng tuyển sinh',
      role: 'Phê duyệt',
    },
  ];
}

export default function TrackDetailPage() {
  const t = useTranslations('track');
  const tErrors = useTranslations('errors');
  const format = useFormatter();
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? '');
  const { data: application, isPending, isError, refetch } = useApplication(code);
  const notFound = !isPending && !isError && !application;

  const parentName = application?.applicant.fullName ?? '';
  const steps = useMemo(() => demoTimeline(parentName), [parentName]);
  const studentName = application ? studentNameOf(application) : '';

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      {isPending && (
        <div className="space-y-10">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-56" />
          </div>
          <Skeleton className="h-44 w-full" />
        </div>
      )}

      {isError && (
        <ErrorState
          title={tErrors('generic.title')}
          description={tErrors('generic.description')}
          retryLabel={tErrors('retry')}
          onRetry={() => void refetch()}
        />
      )}

      {notFound && (
        <EmptyState
          icon={FileSearch}
          title={t('notFound.title')}
          description={t('notFound.description')}
        />
      )}

      {application && (
        <div className="space-y-10">
          {/* Identity — plain layout, no card / border / shadow */}
          <header className="space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('codeLabel')}
              </p>
              <p className="bg-gradient-to-r from-primary via-primary to-primary/55 bg-clip-text font-display text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                {code}
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-0.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('studentName')}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {studentName && studentName !== '—' ? studentName : t('notProvided')}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('parentName')}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {application.applicant.fullName}
                </dd>
              </div>
            </dl>
          </header>

          {/* State journey */}
          <section className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">{t('timeline.title')}</h2>
              <CurrentPill state={steps[steps.length - 1]!.state} />
            </div>

            <ol className="relative space-y-7 pl-8">
              {/* Rail — tenant gradient line (fill, not a border) */}
              <span
                aria-hidden
                className="absolute bottom-3 left-[7px] top-1 w-0.5 rounded-full bg-gradient-to-b from-primary via-primary/50 to-primary/15"
              />
              {steps.map((step, i) => {
                const meta = APPLICATION_STATES[step.state]!;
                const isCurrent = i === steps.length - 1;
                return (
                  <li key={step.state} className="relative">
                    <span
                      aria-hidden
                      className={cn(
                        'absolute -left-8 top-0.5 flex size-4 items-center justify-center rounded-full',
                        isCurrent ? 'bg-primary' : 'bg-primary/15',
                      )}
                    >
                      <span
                        className={cn(
                          'rounded-full',
                          isCurrent ? 'size-1.5 bg-background' : 'size-2 bg-primary',
                        )}
                      />
                    </span>
                    <div className="space-y-1">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isCurrent ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {meta.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format.dateTime(step.at, { dateStyle: 'medium', timeStyle: 'short' })}
                        {' · '}
                        {t('timeline.by', { name: step.by })}
                        <span className="opacity-70"> ({step.role})</span>
                      </p>
                      {step.note && (
                        <p className="mt-1.5 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-relaxed text-foreground/75">
                          {step.note}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      )}
    </main>
  );
}

function CurrentPill({ state }: { state: ApplicationState }) {
  const meta = APPLICATION_STATES[state]!;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      {meta.label}
    </span>
  );
}
