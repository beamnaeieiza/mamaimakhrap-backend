import { credential } from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import serviceAccount from '../firebase-adminsdk.json';

export const init = () => {
    const app = initializeApp({
        credential: credential.cert(serviceAccount as any)
    });
}