export type JwtPayload = {
  sub: number;
  email: string;
  role: string;
};

export type AuthUser = {
  id: number;
  email: string;
  role: string;
};
