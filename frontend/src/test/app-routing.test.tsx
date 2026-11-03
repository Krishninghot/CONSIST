import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  it("matches a page for / instead of falling back to not found", () => {
    const matches = router.matchRoutes("/");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.at(-1)?.routeId).toBe("/");
  });

  it("matches a page for /auth instead of falling back to not found", () => {
    const matches = router.matchRoutes("/auth");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.at(-1)?.routeId).toBe("/auth");
  });

  it("matches a page for /onboarding instead of falling back to not found", () => {
    const matches = router.matchRoutes("/onboarding");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.at(-1)?.routeId).toBe("/onboarding");
  });

  it("matches all protected core shell routes in the route tree", () => {
    const shellRoutes = [
      { path: "/dashboard", expectedId: "/_authenticated/_shell/dashboard" },
      { path: "/habits", expectedId: "/_authenticated/_shell/habits" },
      { path: "/calendar", expectedId: "/_authenticated/_shell/calendar" },
      { path: "/goals", expectedId: "/_authenticated/_shell/goals" },
      { path: "/analytics", expectedId: "/_authenticated/_shell/analytics" },
      { path: "/achievements", expectedId: "/_authenticated/_shell/achievements" },
      { path: "/profile", expectedId: "/_authenticated/_shell/profile" },
      { path: "/settings", expectedId: "/_authenticated/_shell/settings" },
    ];

    for (const r of shellRoutes) {
      const matches = router.matchRoutes(r.path);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
      expect(matches.at(-1)?.routeId).toBe(r.expectedId);
    }
  });
});
