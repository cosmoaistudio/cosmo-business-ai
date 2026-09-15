export type AuthView = "login" | "signup" | "forgot" | "reset";

export interface SignUpParams {
  email: string;
  password: string;
  fullName?: string;
  companyName?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

export interface UpdatePasswordParams {
  password: string;
}
