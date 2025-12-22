import { useQuery } from "@tanstack/react-query";
import { sectionsApi, subSectionsApi } from "@/api/sections.api";

export function useSections(includeSystem = true) {
  return useQuery({
    queryKey: ["sections", { includeSystem }],
    queryFn: async () => {
      const response = await sectionsApi.list(includeSystem);
      return response.data.data;
    },
  });
}

export function useSection(id: string) {
  return useQuery({
    queryKey: ["section", id],
    queryFn: async () => {
      const response = await sectionsApi.get(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useSubSections() {
  return useQuery({
    queryKey: ["subsections"],
    queryFn: async () => {
      const response = await subSectionsApi.list();
      return response.data.data;
    },
  });
}
