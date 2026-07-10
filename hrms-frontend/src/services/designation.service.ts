import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { createReferenceDataService } from "./reference-data.service";

export const designationService = createReferenceDataService(
  API_ENDPOINTS.DESIGNATIONS,
  "designations",
  "designation"
);
