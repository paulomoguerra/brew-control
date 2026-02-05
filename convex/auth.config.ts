import { AuthConfig } from "convex/server";

const domain = process.env.CLERK_JWT_ISSUER ?? process.env.CLERK_ISSUER;
const applicationID = process.env.CLERK_JWT_AUDIENCE ?? "convex";

if (!domain) {
  throw new Error(
    "Missing CLERK_JWT_ISSUER. Set it to your Clerk JWT issuer (e.g. https://<your-frontend-api>.clerk.accounts.dev)."
  );
}

export default {
  providers: [
    {
      domain,
      applicationID,
    },
  ],
} satisfies AuthConfig;
