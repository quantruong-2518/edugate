"use client";

import { useState } from "react";

import {
  APPLICATION_STATES,
  getAllowedTransitions,
  isTerminalState,
  type ApplicationRole,
  type ApplicationState,
  type Transition,
} from "@shared/admission";

import { Button } from "@ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { cn } from "@ui/lib/utils";

import { STATE_ICON } from "./state-icon";

export type StateActionsProps = {
  state: ApplicationState;
  role: ApplicationRole;
  /**
   * Caller wires this up to the BE transition endpoint (pha 2). Pha 1
   * callers can pass an optimistic mutation that updates local state and
   * toasts. Receiving the full transition record (not just `to`) lets the
   * caller log it without re-deriving.
   */
  onTransition: (
    transition: Transition,
    reason: string | null,
  ) => void | Promise<void>;
  className?: string;
  /** Disable all buttons (e.g. while a transition is in flight). */
  busy?: boolean;
};

type PendingReason = { transition: Transition };

export function StateActions({
  state,
  role,
  onTransition,
  className,
  busy = false,
}: StateActionsProps) {
  const [pending, setPending] = useState<PendingReason | null>(null);
  const [reason, setReason] = useState("");
  // SYSTEM transitions are never user-driven; filter defensively even though
  // `getAllowedTransitions` already excludes them for non-SYSTEM roles.
  const transitions = getAllowedTransitions(state, role).filter(
    (t) => !t.roles.every((r) => r === "SYSTEM") || role === "SYSTEM",
  );

  if (transitions.length === 0) {
    return (
      <p
        className={cn("text-sm text-muted-foreground", className)}
        data-empty
      >
        {isTerminalState(state)
          ? "Hồ sơ ở trạng thái kết thúc — không có hành động."
          : "Vai trò hiện tại không có hành động khả dụng."}
      </p>
    );
  }

  function handleClick(t: Transition) {
    if (t.requireReason) {
      setReason("");
      setPending({ transition: t });
    } else {
      void onTransition(t, null);
    }
  }

  function handleConfirmReason() {
    if (!pending) return;
    const trimmed = reason.trim();
    if (!trimmed) return;
    const t = pending.transition;
    setPending(null);
    void onTransition(t, trimmed);
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {transitions.map((t) => {
        const Icon = STATE_ICON[t.to]!;
        const targetMeta = APPLICATION_STATES[t.to]!;
        // Destructive intent for outcomes the user will read as a "down" move.
        const destructive = t.to === "REJECTED" || t.to === "CANCELLED";
        return (
          <Button
            key={`${t.from}->${t.to}`}
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={() => handleClick(t)}
            disabled={busy}
            title={targetMeta.description}
          >
            <Icon className="mr-2 size-4" aria-hidden />
            {t.action}
          </Button>
        );
      })}

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pending?.transition.action}</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do — phụ huynh sẽ nhận được nội dung này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="state-action-reason">Lý do</Label>
            <Textarea
              id="state-action-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Thiếu bản sao giấy khai sinh."
              rows={4}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPending(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReason}
              disabled={reason.trim().length === 0}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
