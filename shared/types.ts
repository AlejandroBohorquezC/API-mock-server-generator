export type ResourceData = Record<string, unknown>;

export type FieldType = 'string' | 'number' | 'boolean' | 'unknown';

export interface ResourceDocs {
  fields: Record<string, FieldType>;
  requiredFields: string[];
  endpoints: string[];
  examplePost: Record<string, unknown>;
  examplePut: Record<string, unknown>;
}

export interface MockResource {
  data: ResourceData[];
}

export interface MockStore {
  [resourceName: string]: MockResource;
}

export interface RegisterPayload {
  sessionId: string;
  schema: Record<string, ResourceData[]>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
}
