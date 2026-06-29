import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDocuments, uploadDocument, deleteDocument, uploadZip } from "@/api/documents";

export function useDocuments() {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const uploadZipMutation = useMutation({
    mutationFn: uploadZip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadZip: uploadZipMutation.mutateAsync,
    isUploadingZip: uploadZipMutation.isPending,
    remove: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    refetch: documentsQuery.refetch,
  };
}
