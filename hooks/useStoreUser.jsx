import { useUser } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

/**
 * Hook: useStoreUser
 *
 * Purpose:
 * ------------
 * Keeps the authenticated user in sync with the backend `users` table.
 * This ensures that whenever a Clerk-authenticated user logs in,
 * their identity is stored (or updated) in Convex via the `storeUser` mutation.
 *
 * Flow:
 * ------------
 * 1. Wait for authentication state from Convex (`useConvexAuth`) + Clerk (`useUser`).
 * 2. When authenticated, trigger `storeUser` mutation on the backend:
 *      - If user exists → return existing `_id`.
 *      - If new → insert a record.
 * 3. Save returned `userId` in local state to track sync status.
 * 4. Provide combined `isLoading` + `isAuthenticated` flags for UI consumption.
 *
 * Usage:
 * ------------
 * const { isLoading, isAuthenticated } = useStoreUser();
 * if (isLoading) return <Spinner />;
 * if (isAuthenticated) return <Dashboard />;
 */

export function useStoreUser() {
  
  // Convex authentication status (syncs with backend auth).
  const { isLoading, isAuthenticated } = useConvexAuth();

  // Clerk user object (frontend auth provider).
  const { user } = useUser();

  // Local state: stores the Convex `user._id` once synced.
  const [userId, setUserId] = useState<string | null>(null);

  // Convex mutation: inserts or updates the user in the DB.
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    // Bail out early if the user is not authenticated.
    if (!isAuthenticated) {
      return;
    }

    /**
     * When authenticated:
     * - Call `storeUser()` (no args needed; server derives info from auth).
     * - Save returned `userId` into state.
     */
    async function createUser() {
      const id = await storeUser();
      setUserId(id);
    }
    createUser();

    // Cleanup: reset `userId` when effect is disposed.
    return () => setUserId(null);

    /**
     * Effect Dependencies:
     * - Reruns if:
     *    - Authentication state changes.
     *    - The mutation reference changes.
     *    - The user logs in with a different identity (`user?.id`).
     */
  }, [isAuthenticated, storeUser, user?.id]);

  /**
   * Return a combined status object for UI logic:
   * - `isLoading`: true until user is both authenticated & stored.
   * - `isAuthenticated`: true only if backend + frontend auth are in sync.
   */
  return {
    isLoading: isLoading || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
  };
}
