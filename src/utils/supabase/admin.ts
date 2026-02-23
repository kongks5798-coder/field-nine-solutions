/**
 * Re-export the service_role admin client as `admin` for convenient imports.
 * Usage: import { admin } from "@/utils/supabase/admin";
 */
import { getAdminClient } from "@/lib/supabase-admin";

export const admin = getAdminClient();
