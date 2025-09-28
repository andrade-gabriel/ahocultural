import { UserSaveRequest, UserGetRequest, UserEntity } from "./types";

type HashFn = (plain: string) => Promise<string> | string;

export async function toUserEntity(
  input: UserSaveRequest,
  opts?: {
    hash?: HashFn;   // ex.: (pwd) => bcrypt.hash(pwd, 10)
  }
): Promise<UserEntity> {
  const email = input.email.toLowerCase().trim();
  const firstName = input.firstName.trim();
  const now = new Date();
  const active = true;
  const password = opts?.hash ? await opts.hash(input.password) : input.password;

  return {
    email,
    password,
    firstName,
    createdAt: now,
    updatedAt: now,
    active: active
  };
}

export async function toUserGetRequest(
  input: UserEntity
): Promise<UserGetRequest> {
  const email = input.email.toLowerCase().trim();
  const firstName = input.firstName.trim();
  const createdAt = input.createdAt;
  const updatedAt = input.updatedAt;

  return {
    email,
    firstName,
    createdAt: createdAt,
    updatedAt: updatedAt,
  };
}