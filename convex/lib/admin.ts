import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

type AuthCtx = GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>;

/**
 * Requires a signed-in user whose email matches Convex env `ADMIN_EMAIL`
 * (trimmed, case-insensitive). Fails closed if `ADMIN_EMAIL` is unset.
 */
export async function requireContentAdmin(ctx: AuthCtx): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    throw new Error("Unauthorized: ADMIN_EMAIL is not configured.");
  }
  // Convex Auth JWTs don't carry an email claim, so read it from the users table.
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const userEmail = (user?.email ?? identity.email)?.trim().toLowerCase();
  if (!userEmail || userEmail !== adminEmail) {
    throw new Error("Unauthorized: this account cannot edit portfolio content.");
  }
}
