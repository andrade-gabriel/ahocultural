import { JwtAuthentication } from './types';
import { getUserAsync } from '../shared/users/store'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken';
import { config } from './config'

export async function handleAuthentication(
    email: string,
    password: string
): Promise<JwtAuthentication | null> {

    const user = await getUserAsync(email, config.s3.bucket);
    if (user && user.active) {
        if (await bcrypt.compare(password, user.password)) {
            // generate jwt based on
            // config.jwt.secret
            // config.jwt.expiresInSeconds

            const jwtResponse = jwt.sign({
                firstName: user.firstName,
                email: user.email,
            }, config.jwt.secret, {
                algorithm: 'HS256',
                expiresIn: config.jwt.expiresInSeconds
            });

            let res: JwtAuthentication = {
                token_type: 'Bearer',
                access_token: jwtResponse,
                expires_in: config.jwt.expiresInSeconds
            };
            return res;
        }
    }
    return null;
}