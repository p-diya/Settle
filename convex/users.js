import { mutation } from "./_generated/server";

/**
 * Mutation: store
 *
 * Purpose:
 * ------------
 * Persists the authenticated user into the `users` table.
 * Ensures that each unique identity (based on tokenIdentifier) is stored only once.
 * If the user already exists but their profile information changes (e.g. name),
 * the record is updated (patched) instead of creating a duplicate.
 *
 * Flow:
 * ------------
 * 1. Validate user identity from authentication context.
 * 2. Look up user in DB by `tokenIdentifier`.
 * 3. If found:
 *      - Update (patch) the record if the user's name has changed.
 *      - Return existing user `_id`.
 * 4. If not found:
 *      - Insert a new user document with name + tokenIdentifier.
 *      - Return new `_id`.
 */

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    
    // Step 1: Ensure the request is authenticated.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    /**
     * Step 2: Check if a user with this tokenIdentifier already exists.
     *
     * Note:
     * - We use an index (`by_token`) for efficient lookups.
     * - If an index is not yet defined, fallback queries can be used:
     *   ctx.db.query("users")
     *     .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
     *     .unique();
     */

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    // Step 3: If user already exists in DB
    if (user !== null) {
      // Handle possible profile update (e.g., changed display name).
      if (user.name !== identity.name) {
        await ctx.db.patch(user._id, { name: identity.name });
      }
      return user._id; // Return existing user document ID.
    }

    // Step 4: If no user exists, create a new record in DB.
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous", // Fallback name if none provided.
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email,
      imageUrl: identity.pictureUrl,
    });
  },
});
