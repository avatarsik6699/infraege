export interface paths {
  '/api/v1/health': {
    get: operations['health_check_api_v1_health_get'];
  };
  '/api/v1/public/auth/login': {
    post: operations['login_api_v1_public_auth_login_post'];
  };
  '/api/v1/public/auth/register': {
    post: operations['register_api_v1_public_auth_register_post'];
  };
  '/api/v1/public/auth/refresh': {
    post: operations['refresh_api_v1_public_auth_refresh_post'];
  };
  '/api/v1/public/auth/me': {
    get: operations['me_api_v1_public_auth_me_get'];
    delete: operations['delete_me_api_v1_public_auth_me_delete'];
  };
  '/api/v1/public/auth/logout': {
    post: operations['logout_api_v1_public_auth_logout_post'];
  };
}

export interface components {
  schemas: {
    LoginRequest: { email: string; password: string };
    RegisterRequest: { email: string; password: string; consent_152fz: true };
    RefreshRequest: { refresh_token: string };
    TokenPair: { access_token: string; refresh_token: string; token_type: string };
    UserOut: {
      id: string;
      email: string;
      role: 'user' | 'admin';
      is_active: boolean;
      consent_152fz: boolean;
      created_at: string;
    };
    AccountDeletionResponse: { deleted: boolean };
    HealthResponse: { status: string; db: string };
  };
}

interface operations {
  health_check_api_v1_health_get: {
    responses: { 200: { content: { 'application/json': components['schemas']['HealthResponse'] } } };
  };
  login_api_v1_public_auth_login_post: {
    requestBody: { content: { 'application/json': components['schemas']['LoginRequest'] } };
    responses: { 200: { content: { 'application/json': components['schemas']['TokenPair'] } } };
  };
  register_api_v1_public_auth_register_post: {
    requestBody: { content: { 'application/json': components['schemas']['RegisterRequest'] } };
    responses: { 201: { content: { 'application/json': components['schemas']['TokenPair'] } } };
  };
  refresh_api_v1_public_auth_refresh_post: {
    requestBody: { content: { 'application/json': components['schemas']['RefreshRequest'] } };
    responses: { 200: { content: { 'application/json': components['schemas']['TokenPair'] } } };
  };
  me_api_v1_public_auth_me_get: {
    responses: { 200: { content: { 'application/json': components['schemas']['UserOut'] } } };
  };
  delete_me_api_v1_public_auth_me_delete: {
    responses: { 200: { content: { 'application/json': components['schemas']['AccountDeletionResponse'] } } };
  };
  logout_api_v1_public_auth_logout_post: {
    responses: { 200: { content: { 'application/json': { message: string } } } };
  };
}
