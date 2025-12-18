import { apiClient } from "./client";
import type {
  Section,
  SubSection,
  SectionClosure,
  TimeSlot,
  CreateTimeSlotInput,
  UpdateTimeSlotInput,
  SlotType,
} from "@/types";
import type { ApiResponse } from "@/types";

// ============================================
// TYPES
// ============================================

export interface CreateSectionInput {
  name: string;
  description?: string;
  allowedDaysIn?: number[];
  allowedDaysOut?: number[];
  sortOrder?: number;
}

export interface UpdateSectionInput {
  name?: string;
  description?: string;
  allowedDaysIn?: number[];
  allowedDaysOut?: number[];
  sortOrder?: number;
}

export interface CreateSubSectionInput {
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateSubSectionInput {
  name?: string;
  description?: string;
  sectionId?: string | null;
  sortOrder?: number;
}

export interface CreateClosureInput {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
}

export interface UpdateClosureInput {
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export interface SectionWithCount extends Section {
  _count?: {
    products: number;
  };
}

export interface SubSectionWithCount extends SubSection {
  _count?: {
    products: number;
  };
  section?: {
    id: string;
    name: string;
  } | null;
}

// ============================================
// SECTIONS API
// ============================================

export const sectionsApi = {
  /**
   * Get all sections with subsections
   */
  list: (includeSystem = false) => {
    const params = includeSystem ? "?includeSystem=true" : "";
    return apiClient.get<ApiResponse<SectionWithCount[]>>(`/sections${params}`);
  },

  /**
   * Get section by ID
   */
  get: (id: string) => {
    return apiClient.get<ApiResponse<SectionWithCount>>(`/sections/${id}`);
  },

  /**
   * Create section (admin)
   */
  create: (data: CreateSectionInput) => {
    return apiClient.post<ApiResponse<Section>>("/sections", data);
  },

  /**
   * Update section (admin)
   */
  update: (id: string, data: UpdateSectionInput) => {
    return apiClient.patch<ApiResponse<Section>>(`/sections/${id}`, data);
  },

  /**
   * Delete section (admin)
   */
  delete: (id: string) => {
    return apiClient.delete<ApiResponse<void>>(`/sections/${id}`);
  },

  /**
   * Create subsection under a section (admin)
   */
  createSubSection: (sectionId: string, data: CreateSubSectionInput) => {
    return apiClient.post<ApiResponse<SubSection>>(
      `/sections/${sectionId}/subsections`,
      data,
    );
  },
};

// ============================================
// SUBSECTIONS API
// ============================================

export const subSectionsApi = {
  /**
   * Get all subsections
   */
  list: () => {
    return apiClient.get<ApiResponse<SubSection[]>>("/subsections");
  },

  /**
   * Get subsection by ID
   */
  get: (id: string) => {
    return apiClient.get<ApiResponse<SubSectionWithCount>>(
      `/subsections/${id}`,
    );
  },

  /**
   * Get orphan subsections (no parent section)
   */
  listOrphans: () => {
    return apiClient.get<ApiResponse<SubSectionWithCount[]>>(
      "/subsections/orphans",
    );
  },

  /**
   * Update subsection (admin)
   */
  update: (id: string, data: UpdateSubSectionInput) => {
    return apiClient.patch<ApiResponse<SubSection>>(`/subsections/${id}`, data);
  },

  /**
   * Delete subsection (admin)
   */
  delete: (id: string) => {
    return apiClient.delete<ApiResponse<void>>(`/subsections/${id}`);
  },
};

// ============================================
// CLOSURES API
// ============================================

export const closuresApi = {
  /**
   * Get all closures for a section
   */
  list: (sectionId: string, includeExpired = true) => {
    const params = includeExpired ? "" : "?includeExpired=false";
    return apiClient.get<ApiResponse<SectionClosure[]>>(
      `/sections/${sectionId}/closures${params}`,
    );
  },

  /**
   * Get closure by ID
   */
  get: (closureId: string) => {
    return apiClient.get<ApiResponse<SectionClosure>>(`/closures/${closureId}`);
  },

  /**
   * Get current active closure for a section
   */
  getCurrent: (sectionId: string) => {
    return apiClient.get<ApiResponse<SectionClosure | null>>(
      `/sections/${sectionId}/closures/current`,
    );
  },

  /**
   * Create closure for a section (admin)
   */
  create: (sectionId: string, data: CreateClosureInput) => {
    return apiClient.post<ApiResponse<SectionClosure>>(
      `/sections/${sectionId}/closures`,
      data,
    );
  },

  /**
   * Update closure (admin)
   */
  update: (closureId: string, data: UpdateClosureInput) => {
    return apiClient.patch<ApiResponse<SectionClosure>>(
      `/closures/${closureId}`,
      data,
    );
  },

  /**
   * Delete closure (admin)
   */
  delete: (closureId: string) => {
    return apiClient.delete<ApiResponse<void>>(`/closures/${closureId}`);
  },
};

// ============================================
// TIME SLOTS API
// ============================================

export const timeSlotsApi = {
  /**
   * Get all time slots for a section
   */
  list: (sectionId: string, type?: SlotType) => {
    const params = type ? `?type=${type}` : "";
    return apiClient.get<ApiResponse<TimeSlot[]>>(
      `/sections/${sectionId}/timeslots${params}`,
    );
  },

  /**
   * Get time slots grouped by day for a section
   */
  listGrouped: (sectionId: string, type?: SlotType) => {
    const params = type ? `?type=${type}` : "";
    return apiClient.get<ApiResponse<Record<number, TimeSlot[]>>>(
      `/sections/${sectionId}/timeslots/grouped${params}`,
    );
  },

  /**
   * Get time slot by ID
   */
  get: (slotId: string) => {
    return apiClient.get<ApiResponse<TimeSlot>>(`/timeslots/${slotId}`);
  },

  /**
   * Create time slot for a section (admin)
   */
  create: (sectionId: string, data: CreateTimeSlotInput) => {
    return apiClient.post<ApiResponse<TimeSlot>>(
      `/sections/${sectionId}/timeslots`,
      data,
    );
  },

  /**
   * Update time slot (admin)
   */
  update: (slotId: string, data: UpdateTimeSlotInput) => {
    return apiClient.patch<ApiResponse<TimeSlot>>(`/timeslots/${slotId}`, data);
  },

  /**
   * Delete time slot (admin)
   */
  delete: (slotId: string) => {
    return apiClient.delete<ApiResponse<void>>(`/timeslots/${slotId}`);
  },
};
