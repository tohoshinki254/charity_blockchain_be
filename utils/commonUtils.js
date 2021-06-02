import SHA256 from 'crypto-js/sha256';
import { v1 as uuidv1 } from 'uuid';

export const hash = (data) => {
    return SHA256(data).toString();
};

export const generateId = () => {
    return uuidv1();
}