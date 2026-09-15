export interface OptionImageUploadResult {
  path: string;
  publicUrl: string;
}

export interface UploadOptionImageParams {
  file: File;
  optionId: string;
  organizationId: string;
  previousPath?: string | null;
  persistToDatabase?: boolean;
}

export interface RemoveOptionImageParams {
  path?: string | null;
  optionId?: string;
  organizationId?: string;
  publicUrl?: string | null;
  persistToDatabase?: boolean;
}
