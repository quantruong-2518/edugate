"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib/utils";

import { useSendEmailOtp, useVerifyEmailOtp } from "@/lib/api/queries";

const OTP_LENGTH = 6;

/** Six-box numeric OTP with auto-advance, backspace, and paste-to-fill. */
function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(OTP_LENGTH).slice(0, OTP_LENGTH).split("");

  const focusBox = (i: number) => refs.current[i]?.focus();

  const setAt = (i: number, char: string) => {
    const arr = value.padEnd(OTP_LENGTH).split("");
    arr[i] = char;
    const next = arr.join("").trimEnd();
    onChange(next);
    if (char && i < OTP_LENGTH - 1) focusBox(i + 1);
    if (next.length === OTP_LENGTH && !next.includes(" ")) onComplete?.(next);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]?.trim()) {
        setAt(i, "");
      } else if (i > 0) {
        setAt(i - 1, "");
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusBox(i - 1);
    } else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
      focusBox(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    onChange(pasted);
    const last = Math.min(pasted.length, OTP_LENGTH - 1);
    focusBox(last);
    if (pasted.length === OTP_LENGTH) onComplete?.(pasted);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <Input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digits[i]?.trim() ?? ""}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, char);
          }}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`Ô ${i + 1}`}
          className={cn(
            "size-12 p-0 text-center font-mono text-xl font-semibold sm:size-14 sm:text-2xl",
          )}
        />
      ))}
    </div>
  );
}

export function VerifyEmailStep({
  email,
  onSubmit,
}: {
  email: string;
  onSubmit: () => Promise<void>;
}) {
  const t = useTranslations("apply.verifyEmail");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sentRef = useRef(false);
  const sendOtp = useSendEmailOtp();
  const verifyOtp = useVerifyEmailOtp();

  const sendMutate = sendOtp.mutateAsync;
  const send = useCallback(async () => {
    const res = await sendMutate({ email });
    toast.info(t("sentToast", { code: res.devCode }));
  }, [email, t, sendMutate]);

  // Send once on entering the step.
  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    void send();
  }, [send]);

  const verify = useCallback(
    async (value: string) => {
      if (value.length !== OTP_LENGTH) return;
      setSubmitting(true);
      const res = await verifyOtp.mutateAsync({ email, code: value });
      if (!res.verified) {
        setSubmitting(false);
        toast.error(t("invalidOtp"));
        return;
      }
      // Wizard navigates away on success; keep the button disabled meanwhile.
      await onSubmit();
    },
    [email, onSubmit, t, verifyOtp],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          {email && (
            <p className="text-sm font-medium text-foreground">{email}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="sr-only">{t("otpLabel")}</Label>
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={(c) => void verify(c)}
          disabled={submitting}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          size="lg"
          onClick={() => void verify(code)}
          disabled={submitting || code.length !== OTP_LENGTH}
          className="w-full max-w-xs"
        >
          {t("verify")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void send()}
          disabled={sendOtp.isPending || submitting}
        >
          {t("resend")}
        </Button>
      </div>
    </div>
  );
}
