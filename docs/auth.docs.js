const authDocs = {
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new shop owner',
        description: 'Creates a new shop and an owner account in a single step. Returns access and refresh tokens.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'shopName'],
                properties: {
                  name:     { type: 'string',  example: 'Rahim Uddin' },
                  email:    { type: 'string',  example: 'rahim@stockbd.com' },
                  password: { type: 'string',  example: 'securePass123', minLength: 6 },
                  phone:    { type: 'string',  example: '01712345678' },
                  shopName: { type: 'string',  example: 'Rahim General Store' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: {
                          type: 'object',
                          properties: {
                            id:       { type: 'string', example: 'uuid-here' },
                            name:     { type: 'string', example: 'Rahim Uddin' },
                            email:    { type: 'string', example: 'rahim@stockbd.com' },
                            phone:    { type: 'string', example: '01712345678' },
                            role:     { type: 'string', example: 'owner' },
                            shopId:   { type: 'string', example: 'uuid-here' },
                            shopName: { type: 'string', example: 'Rahim General Store' },
                          },
                        },
                        accessToken:  { type: 'string', example: 'eyJhbGci...' },
                        refreshToken: { type: 'string', example: 'eyJhbGci...' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error:   { type: 'string',  example: 'name, email, password and shopName are required' },
                  },
                },
              },
            },
          },
          409: {
            description: 'Email already in use',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error:   { type: 'string',  example: 'Email already in use' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', example: 'rahim@stockbd.com' },
                  password: { type: 'string', example: 'securePass123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: {
                          type: 'object',
                          properties: {
                            id:       { type: 'string', example: 'uuid-here' },
                            name:     { type: 'string', example: 'Rahim Uddin' },
                            role:     { type: 'string', example: 'owner' },
                            shopId:   { type: 'string', example: 'uuid-here' },
                            shopName: { type: 'string', example: 'Rahim General Store' },
                          },
                        },
                        accessToken:  { type: 'string', example: 'eyJhbGci...' },
                        refreshToken: { type: 'string', example: 'eyJhbGci...' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error:   { type: 'string',  example: 'Invalid email or password' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout and revoke refresh token',
        description: 'Deletes the refresh token from the server. The client should discard the access token.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string', example: 'eyJhbGci...' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string',  example: 'Logged out successfully' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Issues a new access token and rotates the refresh token. The old refresh token is revoked.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', example: 'eyJhbGci...' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Tokens refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        accessToken:  { type: 'string', example: 'eyJhbGci...' },
                        refreshToken: { type: 'string', example: 'eyJhbGci...' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid or revoked refresh token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error:   { type: 'string',  example: 'Refresh token has been revoked' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        description: 'Returns the authenticated user\'s profile. Requires a valid Bearer access token.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        id:       { type: 'string', example: 'uuid-here' },
                        name:     { type: 'string', example: 'Rahim Uddin' },
                        email:    { type: 'string', example: 'rahim@stockbd.com' },
                        phone:    { type: 'string', example: '01712345678' },
                        role:     { type: 'string', example: 'owner' },
                        shopId:   { type: 'string', example: 'uuid-here' },
                        shopName: { type: 'string', example: 'Rahim General Store' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Access token missing or invalid',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error:   { type: 'string',  example: 'Access token required' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = authDocs;
