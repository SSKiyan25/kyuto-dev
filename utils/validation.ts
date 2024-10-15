import { object, string } from "yup";

export const LoginSchema = object({
  email: string().required().label("Email").email(),
  password: string().required().label("Password").min(6).max(20),
});

export const ForgotPasswordSchema = object({
  email: string().required().label("Email").email(),
});

export const SearchSchema = object({
  search: string().required().max(50),
});
