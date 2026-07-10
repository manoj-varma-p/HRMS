import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { createReferenceDataService } from "./reference-data.service";

export const departmentService = createReferenceDataService(
  API_ENDPOINTS.DEPARTMENTS,
  "departments",
  "department"
);
