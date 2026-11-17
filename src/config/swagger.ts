import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Shared OpenAPI definition. Each module documents its own paths and schemas
 * with `@openapi` JSDoc blocks inside its `*.routes.ts` / `*.docs.ts` files,
 * so people working on different modules never edit the same Swagger file.
 */
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Movie Reviews API',
    version: '1.0.0',
    description: 'REST API for managing movies, reviews and users.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Movie not found' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 57 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Validation error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Unauthorized: {
        description: 'Missing or invalid token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Not allowed to perform this action',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Conflict: {
        description: 'Resource already exists',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition,
  apis: [
    path.join(__dirname, '../modules/**/*.routes.{ts,js}'),
    path.join(__dirname, '../modules/**/*.docs.{ts,js}'),
    path.join(__dirname, '../app.{ts,js}'),
  ],
});
