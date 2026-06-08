export type ResourceData = Record<string, unknown>;

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
}
