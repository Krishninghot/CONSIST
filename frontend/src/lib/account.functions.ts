import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the signed-in user's data and account. */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = context.userId;
    for (const t of [
      "habit_completions",
      "goal_habits",
      "habits",
      "goals",
      "user_achievements",
      "notifications",
      "onboarding_preferences",
    ] as const) {
      await supabaseAdmin.from(t).delete().eq("user_id", id);
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
