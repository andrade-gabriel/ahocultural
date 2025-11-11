import { UserSaveRequest } from "@user/types";
import { validateUser } from '@user/validator';
import { DefaultResponse } from "@utils/response/types"
import { toUserEntity } from "@user/mapper";
import { getUserAsync, saveUserAsync } from '@user/store'
import bcrypt from 'bcryptjs'
import { config } from "./config";

export async function handleSaveUserAsync(
  input: UserSaveRequest
): Promise<DefaultResponse> {
  let errors: string[] = validateUser(input);
  if (errors.length == 0) {
    const user = await getUserAsync(config, input.email);
    if (!user) {
      const userEntity = await toUserEntity(input, {
        hash: (pwd) => bcrypt.hash(pwd, 12)
      })
      const res = await saveUserAsync(config, userEntity);
      if (res)
        return {
          success: true,
          data: null
        }
    }
    errors.push("Operação inválida");
  }
  return {
    success: false,
    errors: errors
  }
}