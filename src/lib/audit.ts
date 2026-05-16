import { supabase } from "@/integrations/supabase/client";

export type AuditStep =
  | "finger_1"
  | "finger_2"
  | "pin"
  | "app_fallback"
  | "enrollment_1"
  | "enrollment_2";

export type AuditMethod = "biometric" | "pin" | "app";
export type AuditOutcome = "success" | "failure" | "cancelled";

/**
 * Logs a biometric / SCA scan outcome. NEVER stores biometric data — only
 * the step, method, outcome, optional reason and timestamp.
 */
export async function logAudit(params: {
  userId: string;
  step: AuditStep;
  method: AuditMethod;
  outcome: AuditOutcome;
  reason?: string;
  transactionId?: string | null;
}) {
  try {
    await supabase.from("biometric_audit").insert({
      user_id: params.userId,
      transaction_id: params.transactionId ?? null,
      step: params.step,
      method: params.method,
      outcome: params.outcome,
      reason: params.reason ?? null,
    });
  } catch {
    // audit must never break the user flow
  }
}
