import { User } from './user.model'

export interface Message {
    id: string;
    content: string;
    has_parrot: boolean;
    created_at: string;
    author: User;
}