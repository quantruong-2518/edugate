"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";

import { sendEmailOtp, verifyEmailOtp } from "@/lib/api/admission";

export function VerifyEmailStep({
  email,
  onSubmit,
}: {
  email: string;
  onSubmit: () => Promise<void>;
}) {
  const t = useTranslations("apply.verifyEmail");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sentRef = useRef(false);

  const send = useCallback(async () => {
    setSending(true);
    try {
      const res = await sendEmailOtp({ email });
      toast.info(t("sentToast", { code: res.devCode }));
    } finally {
      setSending(false);
    }
  }, [email, t]);

  // Send once on entering the step.
  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    void send();
  }, [send]);

  const verify = async () => {
    setSubmitting(true);
    const res = await verifyEmailOtp({ email, code });
    if (!res.verified) {
      setSubmitting(false);
      toast.error(t("invalidOtp"));
      return;
    }
    // Wizard navigates away on success; keep the button disabled meanwhile.
    await onSubmit();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="otp">{t("otpLabel")}</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={verify}
          disabled={submitting || code.length === 0}
        >
          {t("verify")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void send()}
          disabled={sending || submitting}
        >
          {t("resend")}
        </Button>
      </div>
    </div>
  );
}
