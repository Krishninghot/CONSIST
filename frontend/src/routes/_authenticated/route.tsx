import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (typeof window !== "undefined" && localStorage.getItem("consist:demo-mode") === "true") {
      return {
        user: {
          id: "00000000-0000-4000-a000-000000000001",
          email: "alex.rivera@consist.app",
          user_metadata: { full_name: "Alex Rivera", avatar_url: "" },
        },
      };
    }
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.pathname } });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
