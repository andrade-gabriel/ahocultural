import { UserSaveRequest } from "./types";

export function validateUser(
  user: UserSaveRequest
): string[] {
  const errors: string[] = [];

  const email = user.email?.toLowerCase().trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    errors.push("O campo `email` não é um e-mail válido.");

  const firstName = user.firstName?.trim();
  if (!firstName)
    errors.push("O campo `firstName` não é um nome válido.");

  if (!user.password || user.password.length < 8)
    errors.push("O campo `password` não é uma senha válida.");

  return errors;
}