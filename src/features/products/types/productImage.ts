export interface ProductImageUploadResult {
  path: string;
  publicUrl: string;
}

export interface UploadProductImageParams {
  file: File;
  productId: string;
  organizationId: string;
  previousPath?: string | null;
  persistToDatabase?: boolean;
}

export interface RemoveProductImageParams {
  path?: string | null;
  productId?: string;
  organizationId?: string;
  publicUrl?: string | null;
  persistToDatabase?: boolean;
}
