export interface UserEntity {
    email: string;
    password: string;
    firstName: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserGetRequest {
    email: string;
    firstName: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserSaveRequest {
    email: string;
    password: string;
    firstName: string;
}

