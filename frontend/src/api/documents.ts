import client from "./client";
import type { Document, ZipUploadResult, OrganizedDocumentsResponse } from "@/types";

export async function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await client.post<Document>("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function getDocuments(): Promise<Document[]> {
  const response = await client.get<{ documents: Document[]; total: number }>("/documents/");
  return response.data.documents;
}

export async function reprocessDocument(id: number): Promise<Document> {
  const response = await client.post<Document>(`/documents/${id}/reprocess`);
  return response.data;
}

export async function deleteDocument(id: number): Promise<void> {
  await client.delete(`/documents/${id}`);
}

export async function getOrganizedDocuments(): Promise<OrganizedDocumentsResponse> {
  const response = await client.get<OrganizedDocumentsResponse>("/documents/organized");
  return response.data;
}

export async function downloadFolder(folderType?: string): Promise<Blob> {
  const params = folderType ? `?folder_type=${folderType}` : "";
  const response = await client.get(`/documents/download-folder${params}`, {
    responseType: "blob",
    timeout: 120000,
  });
  return response.data;
}

export async function uploadZip(file: File): Promise<ZipUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await client.post<ZipUploadResult>("/documents/upload-zip", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return response.data;
}
