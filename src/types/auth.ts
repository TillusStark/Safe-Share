
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData extends LoginFormData {
  confirmPassword: string;
}
