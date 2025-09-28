import { UserSaveRequest, UserEntity } from "./types";
import { validateUser } from './validator';
import { DefaultResponse } from "../response/types"
import { toUserEntity } from "./mapper";
import { getUserAsync, upsertUserAsync } from './store'
import bcrypt from 'bcryptjs'

export async function handleSaveUserAsync(
  input: UserSaveRequest,
  s3Bucket: string
): Promise<DefaultResponse> {
  let errors: string[] = validateUser(input);
  if(errors.length == 0)
  {
    const user = await getUserAsync(input.email, s3Bucket);
    if (!user)
    {
      const userEntity = await toUserEntity(input, {
        hash: (pwd) => bcrypt.hash(pwd, 12)
      })
      const res = await upsertUserAsync(userEntity, s3Bucket);
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