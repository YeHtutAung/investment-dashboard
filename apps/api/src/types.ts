export type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  FRONTEND_URL?: string;
  GOLD_API_KEY?: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  provider: string;
};

export type Variables = {
  user: User;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
