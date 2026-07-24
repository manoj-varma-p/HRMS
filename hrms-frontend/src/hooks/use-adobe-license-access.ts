import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ROLES } from "@/constants/roles";
import * as adobeLicenseService from "@/services/adobe-license.service";

// Admin/Super Admin always have full access, so the check (and its network
// request) only runs for everyone else — a plain employee an admin has
// granted View or Edit access to via the Manage Access dialog. Shared query
// key means SidebarNav and the Adobe Licenses page both read the same
// cached result instead of firing this twice.
export function useAdobeLicenseAccess() {
  const { user } = useAuth();
  const isAdmin = !!user && (user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN);

  const query = useQuery({
    queryKey: ["adobe-license-access-me"],
    queryFn: () => adobeLicenseService.myAccess(),
    enabled: !!user && !isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  return {
    canAccess: isAdmin || query.data?.hasAccess === true,
    canEdit: isAdmin || query.data?.canEdit === true,
    isLoading: !!user && !isAdmin && query.isLoading,
  };
}
