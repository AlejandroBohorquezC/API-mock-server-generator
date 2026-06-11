import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  FieldType,
  MockStore,
  ResourceDocs,
  ResourceMeta,
  ResourceSchema,
} from './mock.types';

const MAX_RESOURCES_PER_SESSION = 20;
const MAX_ITEMS_PER_RESOURCE = 1000;
const MAX_FIELDS_PER_RESOURCE = 50;
const RESOURCE_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{0,49}$/;

@Injectable()
export class MockService {
  private store: Map<string, MockStore> = new Map();

  register(
    sessionId: string,
    schema: Record<string, Record<string, unknown>[]>,
  ): string[] {
    if (Object.keys(schema).length > MAX_RESOURCES_PER_SESSION) {
      throw new BadRequestException(
        `Maximum ${MAX_RESOURCES_PER_SESSION} resources per session`,
      );
    }

    for (const name of Object.keys(schema)) {
      if (!RESOURCE_NAME_REGEX.test(name)) {
        throw new BadRequestException(
          `Invalid resource name: "${name}". Only letters, numbers and underscores allowed. Must start with a letter.`,
        );
      }
    }

    const normalizedSchema: Record<string, Record<string, unknown>[]> = {};

    for (const [resourceName, value] of Object.entries(
      schema as Record<string, unknown>,
    )) {
      if (Array.isArray(value)) {
        normalizedSchema[resourceName] = value;
      } else if (value !== null && typeof value === 'object') {
        normalizedSchema[resourceName] = [value as Record<string, unknown>];
      } else {
        throw new BadRequestException(
          `Resource "${resourceName}" must be an object or an array of objects`,
        );
      }
    }

    for (const [name, items] of Object.entries(normalizedSchema)) {
      if (items.length > MAX_ITEMS_PER_RESOURCE) {
        throw new BadRequestException(
          `Resource "${name}" exceeds maximum of ${MAX_ITEMS_PER_RESOURCE} initial items`,
        );
      }
    }

    const mockStore: MockStore = {};

    for (const [resourceName, items] of Object.entries(normalizedSchema)) {
      const resourceSchema = this.inferSchema(items);
      const { data, nextId } = this.prepareInitialData(items);

      mockStore[resourceName] = {
        data,
        schema: resourceSchema,
        nextId,
      };
    }

    this.store.set(sessionId, mockStore);
    return Object.keys(normalizedSchema);
  }

  getAll(sessionId: string, resource: string): Record<string, unknown>[] {
    return [...this.getResourceMeta(sessionId, resource).data];
  }

  getOne(
    sessionId: string,
    resource: string,
    id: string,
  ): Record<string, unknown> | undefined {
    const meta = this.getResourceMeta(sessionId, resource);
    const item = meta.data.find((entry) => String(entry.id) === String(id));
    if (!item) {
      throw new NotFoundException({
        success: false,
        error: `Item with id '${id}' not found in '${resource}'`,
        details: { resource, id },
      });
    }
    return item;
  }

  create(
    sessionId: string,
    resource: string,
    body: Record<string, unknown>,
  ): Record<string, unknown> {
    const meta = this.getResourceMeta(sessionId, resource);
    const schemaFields = Object.keys(meta.schema);

    if (schemaFields.length > 0) {
      const bodyKeys = Object.keys(body).filter((key) => key !== 'id');
      const invalidFields = bodyKeys.filter(
        (key) => !schemaFields.includes(key),
      );

      if (invalidFields.length > 0) {
        throw new BadRequestException({
          success: false,
          error: 'Invalid fields detected',
          details: { invalidFields },
        });
      }

      const missingFields = schemaFields.filter((key) => !(key in body));
      if (missingFields.length > 0) {
        throw new BadRequestException({
          success: false,
          error: 'Missing required fields',
          details: { missingFields },
        });
      }

      this.validateFieldTypes(body, meta.schema);
    }

    const newItem: Record<string, unknown> = {
      ...body,
      id: meta.nextId++,
    };
    meta.data.push(newItem);
    return newItem;
  }

  update(
    sessionId: string,
    resource: string,
    id: string,
    body: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    const meta = this.getResourceMeta(sessionId, resource);
    const schemaFields = Object.keys(meta.schema);

    const { id: _ignoredId, ...bodyWithoutId } = body;

    if (schemaFields.length > 0) {
      const bodyKeys = Object.keys(bodyWithoutId);
      const invalidFields = bodyKeys.filter(
        (key) => !schemaFields.includes(key),
      );

      if (invalidFields.length > 0) {
        throw new BadRequestException({
          success: false,
          error: 'Invalid fields detected',
          details: { invalidFields },
        });
      }

      this.validateFieldTypes(bodyWithoutId, meta.schema);
    }

    const index = meta.data.findIndex((item) => String(item.id) === String(id));
    if (index === -1) {
      throw new NotFoundException({
        success: false,
        error: `Item with id '${id}' not found in '${resource}'`,
        details: { resource, id },
      });
    }

    const updated: Record<string, unknown> = {
      ...meta.data[index],
      ...bodyWithoutId,
      id: meta.data[index].id,
    };
    meta.data[index] = updated;
    return updated;
  }

  remove(sessionId: string, resource: string, id: string): boolean {
    const meta = this.getResourceMeta(sessionId, resource);
    const index = meta.data.findIndex((item) => String(item.id) === String(id));
    if (index === -1) {
      throw new NotFoundException({
        success: false,
        error: `Item with id '${id}' not found in '${resource}'`,
        details: { resource, id },
      });
    }
    meta.data.splice(index, 1);
    return true;
  }

  getResources(sessionId: string): string[] {
    const session = this.getSession(sessionId);
    return Object.keys(session);
  }

  getDocs(sessionId: string): Record<string, ResourceDocs> {
    const session = this.getSession(sessionId);
    const docs: Record<string, ResourceDocs> = {};

    for (const [resourceName, meta] of Object.entries(session)) {
      const fields: Record<string, FieldType> = {};
      const requiredFields: string[] = [];

      for (const [fieldName, definition] of Object.entries(meta.schema)) {
        fields[fieldName] = definition.type;
        if (definition.required) {
          requiredFields.push(fieldName);
        }
      }

      const example = this.buildExample(meta.schema);
      const base = `/mock/${sessionId}/${resourceName}`;

      docs[resourceName] = {
        fields,
        requiredFields,
        endpoints: [
          `GET ${base}`,
          `POST ${base}`,
          `GET ${base}/:id`,
          `PUT ${base}/:id`,
          `DELETE ${base}/:id`,
        ],
        examplePost: example,
        examplePut: example,
      };
    }

    return docs;
  }

  private detectType(value: unknown): FieldType {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    switch (typeof value) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      default:
        return 'unknown';
    }
  }

  private validateFieldTypes(
    body: Record<string, unknown>,
    schema: ResourceSchema,
  ): void {
    for (const [field, value] of Object.entries(body)) {
      if (field === 'id') continue;

      const definition = schema[field];
      if (!definition) continue;

      const expectedType = definition.type;
      const receivedType = this.detectType(value);

      if (expectedType === 'unknown' || expectedType === 'null') continue;

      if (receivedType !== expectedType) {
        throw new BadRequestException({
          success: false,
          error: 'Type validation failed',
          details: {
            field,
            expected: expectedType,
            received: receivedType,
          },
        });
      }
    }
  }

  private inferSchema(items: Record<string, unknown>[]): ResourceSchema {
    if (items.length === 0) {
      return {};
    }

    const firstItem = items[0];
    const schema: ResourceSchema = {};

    for (const [fieldName, value] of Object.entries(firstItem)) {
      if (fieldName === 'id') {
        continue;
      }

      const type = this.detectType(value);

      schema[fieldName] = { type, required: true };
    }

    if (Object.keys(schema).length > MAX_FIELDS_PER_RESOURCE) {
      throw new BadRequestException(
        `Resource exceeds maximum of ${MAX_FIELDS_PER_RESOURCE} fields`,
      );
    }

    return schema;
  }

  private prepareInitialData(items: Record<string, unknown>[]): {
    data: Record<string, unknown>[];
    nextId: number;
  } {
    if (items.length === 0) {
      return { data: [], nextId: 1 };
    }

    let maxId = 0;
    for (const item of items) {
      if (item.id !== undefined) {
        const numId = Number(item.id);
        if (!isNaN(numId)) {
          maxId = Math.max(maxId, numId);
        }
      }
    }

    let assignId = maxId > 0 ? maxId + 1 : 1;
    const data = items.map((item) => {
      if (item.id !== undefined) {
        return { ...item };
      }
      const withId = { ...item, id: assignId };
      assignId++;
      return withId;
    });

    return { data, nextId: assignId };
  }

  private buildExample(schema: ResourceSchema): Record<string, unknown> {
    const example: Record<string, unknown> = {};

    for (const [fieldName, definition] of Object.entries(schema)) {
      switch (definition.type) {
        case 'string':
          example[fieldName] = 'string';
          break;
        case 'number':
          example[fieldName] = 0;
          break;
        case 'boolean':
          example[fieldName] = false;
          break;
        case 'object':
          example[fieldName] = {};
          break;
        case 'array':
          example[fieldName] = [];
          break;
        case 'null':
          example[fieldName] = null;
          break;
        default:
          example[fieldName] = 'string';
      }
    }

    return example;
  }

  private getSession(sessionId: string): MockStore {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new NotFoundException({
        success: false,
        error: 'Session not found',
        details: { sessionId },
      });
    }
    return session;
  }

  private getResourceMeta(sessionId: string, resource: string): ResourceMeta {
    const session = this.getSession(sessionId);
    const meta = session[resource];
    if (!meta) {
      throw new NotFoundException({
        success: false,
        error: `Resource '${resource}' does not exist in this session`,
        details: {
          resource,
          availableResources: Object.keys(session),
        },
      });
    }
    return meta;
  }
}
