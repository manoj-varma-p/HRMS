import { apiFetch } from "@/lib/api-client";
import { ReferenceData } from "@/types/employee.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

interface ReferenceDataEndpoints {
  LIST: string;
  CREATE: string;
  UPDATE: (id: string) => string;
  ACTIVATE: (id: string) => string;
  DEACTIVATE: (id: string) => string;
}

export function createReferenceDataService(
  endpoints: ReferenceDataEndpoints,
  listKey: string,
  itemKey: string
) {
  return {
    list(includeInactive = false) {
      const qs = includeInactive ? "?includeInactive=true" : "";
      return apiFetch<ApiSuccess<Record<string, ReferenceData[]>>>(
        `${endpoints.LIST}${qs}`
      ).then((res) => res.data[listKey]);
    },
    create(name: string) {
      return apiFetch<ApiSuccess<Record<string, ReferenceData>>>(
        endpoints.CREATE,
        { method: "POST", body: JSON.stringify({ name }) }
      ).then((res) => res.data[itemKey]);
    },
    update(id: string, name: string) {
      return apiFetch<ApiSuccess<Record<string, ReferenceData>>>(
        endpoints.UPDATE(id),
        { method: "PATCH", body: JSON.stringify({ name }) }
      ).then((res) => res.data[itemKey]);
    },
    activate(id: string) {
      return apiFetch<ApiSuccess<Record<string, ReferenceData>>>(
        endpoints.ACTIVATE(id),
        { method: "PATCH" }
      ).then((res) => res.data[itemKey]);
    },
    deactivate(id: string) {
      return apiFetch<ApiSuccess<Record<string, ReferenceData>>>(
        endpoints.DEACTIVATE(id),
        { method: "PATCH" }
      ).then((res) => res.data[itemKey]);
    },
  };
}
