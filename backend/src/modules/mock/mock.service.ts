import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { MockStore, ResourceData } from './mock.types';

@Injectable()
export class MockService {
  private store: Map<string, MockStore> = new Map();

  register(sessionId: string, schema: Record<string, ResourceData[]>): string[] {
    const mockStore: MockStore = {};
    const resources: string[] = [];

    for (const [resourceName, items] of Object.entries(schema)) {
      const initialData = items.map((item) => ({
        ...item,
        ...(item.id !== undefined ? { id: String(item.id) } : {}),
      }));
      mockStore[resourceName] = { data: initialData };
      resources.push(resourceName);
    }

    this.store.set(sessionId, mockStore);
    return resources;
  }

  getAll(sessionId: string, resource: string): ResourceData[] {
    return [...this.getResourceData(sessionId, resource)];
  }

  getOne(
    sessionId: string,
    resource: string,
    id: string,
  ): ResourceData | undefined {
    const data = this.getResourceData(sessionId, resource);
    return data.find((item) => String(item.id) === String(id));
  }

  create(
    sessionId: string,
    resource: string,
    body: ResourceData,
  ): ResourceData {
    const data = this.getResourceData(sessionId, resource);
    const newItem: ResourceData = {
      ...body,
      id: body.id !== undefined ? String(body.id) : uuidv4(),
    };
    data.push(newItem);
    return newItem;
  }

  update(
    sessionId: string,
    resource: string,
    id: string,
    body: ResourceData,
  ): ResourceData | undefined {
    const data = this.getResourceData(sessionId, resource);
    const index = data.findIndex((item) => String(item.id) === String(id));
    if (index === -1) {
      return undefined;
    }
    const updated: ResourceData = {
      ...data[index],
      ...body,
      id: String(id),
    };
    data[index] = updated;
    return updated;
  }

  remove(sessionId: string, resource: string, id: string): boolean {
    const data = this.getResourceData(sessionId, resource);
    const index = data.findIndex((item) => String(item.id) === String(id));
    if (index === -1) {
      return false;
    }
    data.splice(index, 1);
    return true;
  }

  getResources(sessionId: string): string[] {
    const session = this.getSession(sessionId);
    return Object.keys(session);
  }

  private getSession(sessionId: string): MockStore {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session "${sessionId}" not found`);
    }
    return session;
  }

  private getResourceData(sessionId: string, resource: string): ResourceData[] {
    const session = this.getSession(sessionId);
    const mockResource = session[resource];
    if (!mockResource) {
      throw new NotFoundException(`Resource "${resource}" not found`);
    }
    return mockResource.data;
  }
}
