import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/domain";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  signature_url: string | null;
};

export function useCurrentUser() {
  const { user, loading } = useSession();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, department, signature_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) =>
        (r.role as string) === "admin_process" ? "prod_process_uh" : (r.role as AppRole)
      );
    },
  });

  const rawRoles = rolesQuery.data ?? [];
  const roles = [...rawRoles];
  if (profileQuery.data?.department) {
    const dUpper = profileQuery.data.department.trim().toUpperCase();
    if (
      dUpper.includes("TEKNIK") ||
      dUpper.includes("TEKNISI") ||
      dUpper.includes("TES1201") ||
      dUpper.includes("TES GROUND")
    ) {
      if (!roles.includes("teknisi")) {
        roles.push("teknisi");
      }
    }
  }
  const hasRole = (...wanted: AppRole[]) => wanted.some((r) => roles.includes(r));

  return {
    user: user as User | null,
    profile: profileQuery.data ?? null,
    roles,
    hasRole,
    isAdmin: hasRole("admin"),
    canCreate: hasRole("qc_field", "prod_process_uh", "teknisi", "admin"),
    canReviewQc: hasRole("qc_field", "admin"),
    canApproveUh: hasRole("prod_process_uh", "admin"),
    loading: loading || profileQuery.isLoading || rolesQuery.isLoading,
  };
}
