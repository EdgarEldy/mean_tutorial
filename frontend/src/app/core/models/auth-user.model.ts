export interface AuthRole {
  id: number;
  role_name: string;
}

// Shape of the `user` object embedded in the login response (auth.service.js's login()
// returns the full User row minus password, with roles eager-loaded). The JWT itself only
// carries { id, email, jti }, no role info, so this is the only source of role data.
export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  roles: AuthRole[];
}
