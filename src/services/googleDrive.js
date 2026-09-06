import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { createBackup, readBackup } from '../utils/progress.js';

const CLIENT_ID = import.meta.env?.VITE_GOOGLE_WEB_CLIENT_ID?.trim();
export const googleLoginAvailable = Capacitor.getPlatform() === 'android' && !!CLIENT_ID;
const FILE_NAME = 'bplm-progress-v1.json';

// Access tokens only live in memory. Reconnect after expiry; never persist tokens.
export function createDriveClient({ auth = GoogleSignIn, fetcher = fetch, clientId = CLIENT_ID } = {}) {
    let session = null;
    let initialized = false;
    async function request(url, options = {}) {
        if (!session) throw new Error('Entre com Google novamente.');
        const response = await fetcher(url, {
            ...options,
            signal: AbortSignal.timeout(20000),
            headers: { ...options.headers, Authorization: `Bearer ${session.accessToken}` },
        });
        if (response.status === 401) {
            session = null;
            throw new Error('Sua sessão expirou. Entre com Google novamente.');
        }
        if (!response.ok) throw new Error('Não foi possível acessar o Drive. Confira a conexão e a permissão da conta.');
        return response;
    }
    return {
        async connect() {
            session = null;
            if (!clientId) throw new Error('Login Google ainda não configurado nesta versão.');
            if (!initialized) {
                await auth.initialize({ clientId, scopes: ['https://www.googleapis.com/auth/drive.appdata'] });
                initialized = true;
            }
            const result = await auth.signIn();
            if (!result.accessToken || !result.userId) throw new Error('Autorize o acesso ao backup no Drive.');
            session = { accessToken: result.accessToken, userId: result.userId };
            return { userId: result.userId, email: result.email, displayName: result.displayName };
        },
        async disconnect() {
            session = null;
            await auth.signOut();
        },
        async latest() {
            const userId = session?.userId;
            const query = new URLSearchParams({
                spaces: 'appDataFolder', q: `name = '${FILE_NAME}' and trashed = false`,
                fields: 'files(id,createdTime)', orderBy: 'createdTime desc', pageSize: '1',
            });
            const list = await (await request(`https://www.googleapis.com/drive/v3/files?${query}`)).json();
            if (!list.files?.length) return null;
            const id = encodeURIComponent(list.files[0].id);
            const data = await (await request(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`)).json();
            return readBackup(data, userId);
        },
        async save(progress) {
            const backup = createBackup(progress, session?.userId);
            // Append a snapshot: never overwrite a backup made on another device.
            const boundary = 'bplm_backup_boundary';
            const metadata = { name: FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' };
            const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(backup)}\r\n--${boundary}--`;
            await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
                method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
            });
            return backup;
        },
    };
}

export const googleDrive = createDriveClient();
