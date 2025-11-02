// 数据中心相关API
import axiosInstance from "@/services/axiosInstance";

export async function fetchDataCenter(params?: {
  page?: number;
  pageSize?: number;
  fieldName?: string;
  fieldType?: string;
  status?: string;
  keyword?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  updateData?: {
    id: number | string;
    [key: string]: any;
  };
  value?: number;
}): Promise<{
  success: boolean;
  data: any[];
  total: number;
  currentPage: number;
  totalPages: number;
  sortField: string;
  sortOrder: string;
  message: string;
}> {
  try {
    const response = await axiosInstance.post("/Data", {
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      fieldName: params?.fieldName,
      fieldType: params?.fieldType,
      status: params?.status,
      keyword: params?.keyword,
      createTimeStart: params?.createTimeStart,
      createTimeEnd: params?.createTimeEnd,
      sortField: params?.sortField || "id",
      sortOrder: params?.sortOrder || "asc",
      updateData: params?.updateData,
      value: params?.value || 30,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch data center:", error);
    throw error;
  }
}
