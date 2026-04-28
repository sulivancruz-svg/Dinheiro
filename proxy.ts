import { withAuth } from "next-auth/middleware";
import { NextRequest } from "next/server";

export const proxy = withAuth(
  function proxy(req: NextRequest) {
    // Add any custom logic here if needed
    return undefined;
  },
  {
    callbacks: {
      authorized: async ({ token }) => {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/mentor/:path*",
    "/historico/:path*",
    "/caixinhas/:path*",
  ],
};
