import { UserSaveRequest, UserEntity } from "./types";
import { validateUser } from './validator';
import { DefaultResponse } from "../response/types"
import { toUserEntity } from "./mapper";
import { getUserAsync, upsertUserAsync } from './store'
import bcrypt from 'bcryptjs'

export async function handleSaveUserAsync(
  input: UserSaveRequest
): Promise<DefaultResponse> {

  // TODO: AJUSTAR NO FUTURO
  const bucket = 'ahocultural-database-qa';

  let errors: string[] = validateUser(input);
  if(errors.length == 0)
  {
    const user = await getUserAsync(input.email, bucket);
    if (!user)
    {
      const userEntity = await toUserEntity(input, {
        hash: (pwd) => bcrypt.hash(pwd, 12),
        clock: () => new Date()
      })
      const res = await upsertUserAsync(userEntity, bucket);
      if(res)
        return {
          success: true,
          errors: null
        }
    }
    errors.push("Operação inválida");
  }
  return {
    success: false,
    errors: errors
  }
}