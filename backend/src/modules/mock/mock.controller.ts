import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { MockService } from './mock.service';
import type { ApiResponse, RegisterPayload, ResourceData } from './mock.types';

@Controller('mock')
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @Post('register')
  register(
    @Body() body: RegisterPayload,
  ): ApiResponse<{ sessionId: string; endpoints: string[] }> {
    try {
      const endpoints = this.mockService.register(body.sessionId, body.schema);
      return {
        success: true,
        data: { sessionId: body.sessionId, endpoints },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  @Get(':sessionId/:resource')
  getAll(
    @Param('sessionId') sessionId: string,
    @Param('resource') resource: string,
  ): ApiResponse<ResourceData[]> {
    try {
      const data = this.mockService.getAll(sessionId, resource);
      return { success: true, data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  @Post(':sessionId/:resource')
  @HttpCode(201)
  create(
    @Param('sessionId') sessionId: string,
    @Param('resource') resource: string,
    @Body() body: ResourceData,
  ): ApiResponse<ResourceData> {
    try {
      const data = this.mockService.create(sessionId, resource, body);
      return { success: true, data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  @Get(':sessionId/:resource/:id')
  getOne(
    @Param('sessionId') sessionId: string,
    @Param('resource') resource: string,
    @Param('id') id: string,
  ): ApiResponse<ResourceData> {
    try {
      const data = this.mockService.getOne(sessionId, resource, id);
      if (!data) {
        throw new HttpException(
          { success: false, error: `Item "${id}" not found` },
          HttpStatus.NOT_FOUND,
        );
      }
      return { success: true, data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  @Put(':sessionId/:resource/:id')
  update(
    @Param('sessionId') sessionId: string,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() body: ResourceData,
  ): ApiResponse<ResourceData> {
    try {
      const data = this.mockService.update(sessionId, resource, id, body);
      if (!data) {
        throw new HttpException(
          { success: false, error: `Item "${id}" not found` },
          HttpStatus.NOT_FOUND,
        );
      }
      return { success: true, data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  @Delete(':sessionId/:resource/:id')
  remove(
    @Param('sessionId') sessionId: string,
    @Param('resource') resource: string,
    @Param('id') id: string,
  ): ApiResponse<{ deleted: boolean }> {
    try {
      const deleted = this.mockService.remove(sessionId, resource, id);
      if (!deleted) {
        throw new HttpException(
          { success: false, error: `Item "${id}" not found` },
          HttpStatus.NOT_FOUND,
        );
      }
      return { success: true, data: { deleted: true } };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      if (
        typeof response === 'object' &&
        response !== null &&
        'success' in response
      ) {
        throw error;
      }
      const message =
        typeof response === 'string'
          ? response
          : typeof response === 'object' &&
              response !== null &&
              'message' in response
            ? String((response as { message: unknown }).message)
            : 'An error occurred';
      throw new HttpException({ success: false, error: message }, status);
    }
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    throw new HttpException(
      { success: false, error: message },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
