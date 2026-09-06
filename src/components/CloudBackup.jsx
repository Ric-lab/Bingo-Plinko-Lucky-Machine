import { useRef, useState } from 'react';
import { googleDrive, googleLoginAvailable } from '../services/googleDrive.js';
import { rewardedAds, adPrivacyAvailable } from '../services/rewardedAds.js';

function ProgressSummary({ progress }) {
    return <p className="text-sm">Moedas: {progress.coins}<br />FINGO {progress.levels.FINGO} · BINGO {progress.levels.BINGO} · SPINGO {progress.levels.SPINGO}</p>;
}

export default function CloudBackup({ progress, canRestore, onRestore }) {
    const [account, setAccount] = useState(null);
    const [backup, setBackup] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [confirmRestore, setConfirmRestore] = useState(false);
    const lock = useRef(false);
    const run = async task => {
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setMessage('');
        try { await task(); }
        catch { setMessage('Operação não concluída. Confira sua conexão e entre com Google novamente se necessário.'); }
        finally { lock.current = false; setBusy(false); }
    };
    const button = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold disabled:opacity-40';
    return (
        <section className="px-4 py-3 space-y-2 border-t border-gray-200" aria-label="Backup e privacidade">
            <h3 className="font-bold text-gray-800">Seu progresso</h3>
            <p className="text-xs text-gray-600">Níveis e moedas são salvos neste aparelho. O backup no Drive é manual; não inclui a cartela em andamento.</p>
            {!googleLoginAvailable ? <p className="text-sm text-gray-600">Backup Google indisponível nesta versão.</p> : (
                <>
                    {account && <p className="text-xs break-all">{account.email || account.displayName}</p>}
                    <button className={button} disabled={busy} onClick={() => run(async () => {
                        setAccount(null); setBackup(null); setConfirmRestore(false);
                        const user = await googleDrive.connect();
                        setAccount(user);
                        const latest = await googleDrive.latest();
                        setBackup(latest);
                        setMessage(latest ? 'Backup encontrado. Escolha salvar ou restaurar.' : 'Nenhum backup encontrado. Salve o progresso deste aparelho.');
                    })}>Entrar com Google</button>
                    {account && <>
                        <button className={button} disabled={busy || !progress} onClick={() => run(async () => {
                            setConfirmRestore(false);
                            setBackup(await googleDrive.save(progress));
                            setMessage('Backup salvo no seu Drive.');
                        })}>Salvar backup</button>
                        <button className={button} disabled={busy || !canRestore} onClick={() => run(async () => {
                            const latest = await googleDrive.latest();
                            setBackup(latest); setConfirmRestore(!!latest);
                            if (!latest) setMessage('Nenhum backup encontrado.');
                        })}>Restaurar backup</button>
                        {!canRestore && <p className="text-xs">Volte ao início para restaurar o progresso.</p>}
                        <button className={button} disabled={busy} onClick={() => run(async () => {
                            await googleDrive.disconnect();
                            setAccount(null); setBackup(null); setConfirmRestore(false);
                            setMessage('Conta desconectada. O progresso local foi mantido.');
                        })}>Desconectar Google</button>
                    </>}
                    {confirmRestore && backup && <div className="p-3 rounded-lg bg-amber-50 space-y-2">
                        <p className="font-semibold text-sm">Substituir níveis e moedas deste aparelho?</p>
                        <p className="text-xs">Backup: {new Date(backup.savedAt).toLocaleString()}</p>
                        <ProgressSummary progress={backup.progress} />
                        <p className="text-xs">Progresso atual:</p>
                        <ProgressSummary progress={progress} />
                        <button className={button} disabled={busy || !canRestore} onClick={() => run(async () => {
                            await onRestore(backup.progress);
                            setConfirmRestore(false);
                            setMessage('Progresso restaurado.');
                        })}>Confirmar restauração</button>
                        <button className={button} disabled={busy} onClick={() => setConfirmRestore(false)}>Cancelar</button>
                    </div>}
                </>
            )}
            {adPrivacyAvailable && <button className={button} disabled={busy} onClick={() => run(async () => {
                setMessage(await rewardedAds.privacyOptions() || 'Preferências de anúncios atualizadas.');
            })}>Privacidade dos anúncios</button>}
            {busy && <p role="status" className="text-sm">Aguarde…</p>}
            {message && <p role="status" className="text-sm">{message}</p>}
        </section>
    );
}
