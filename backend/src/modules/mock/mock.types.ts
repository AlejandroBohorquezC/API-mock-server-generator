export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'
  | 'unknown';

export interface FieldDefinition {
  type: FieldType;
  required: boolean;
}

export interface ResourceSchema {
  [fieldName: string]: FieldDefinition;
}

export interface ResourceMeta {
  data: Record<string, unknown>[];
  schema: ResourceSchema;
  nextId: number;
}

export interface MockStore {
  [resourceName: string]: ResourceMeta;
}

export interface SessionStore {
  [sessionId: string]: MockStore;
}

export interface RegisterPayload {
  sessionId: string;
  schema: Record<string, Record<string, unknown>[]>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
}

export interface ResourceDocs {
  fields: Record<string, FieldType>;
  requiredFields: string[];
  endpoints: string[];
  examplePost: Record<string, unknown>;
  examplePut: Record<string, unknown>;
}

export type ResourceData = Record<string, unknown>;
