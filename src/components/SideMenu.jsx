import React from 'react';
import { X, HelpCircle, Music, Volume2, Smartphone, Home } from 'lucide-react';

export default function SideMenu({ isOpen, onClose, onGoHome, settings, onUpdateSettings, cloudSignedIn, onSyncCloud }) {

    const toggleSetting = (key) => {
        onUpdateSettings(prev => {
            const current = prev[key];
            // Cycle: 1 (High) -> 0 (Off) -> 0.5 (Low) -> 1 (High)
            // Or typically: Off -> Low -> High -> Off
            // Let's do: 1 -> 0 -> 0.5 -> 1 (User requested "Off -> 50% -> 100%" implicitly by asking for middle term)
            // Let's do logical cycle: 0 -> 0.5 -> 1 -> 0

            let next;
            if (current === 0) next = 0.5;
            else if (current === 0.5) next = 1;
            else next = 0; // if 1 or anything else

            return { ...prev, [key]: next };
        });
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Menu Drawer */}
            <div
                className={`absolute top-0 right-0 h-full w-[280px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <span className="font-bold text-lg text-gray-800">Menu</span>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto py-2">

                    {/* Settings Section */}
                    <div className="px-4 py-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Settings</h3>
                        <div className="space-y-1">
                            <ToggleItem
                                icon={<Music size={18} />}
                                label="Music"
                                value={settings?.music}
                                onToggle={() => toggleSetting('music')}
                            />
                            <ToggleItem
                                icon={<Volume2 size={18} />}
                                label="Sound Effects"
                                value={settings?.sfx}
                                onToggle={() => toggleSetting('sfx')}
                            />
                            <ToggleItem
                                icon={<Smartphone size={18} />}
                                label="Vibration"
                                value={settings?.vibration}
                                onToggle={() => toggleSetting('vibration')}
                            />
                        </div>
                    </div>

                    <div className="my-2 border-t border-gray-100" />

                    {/* Cloud Save Section */}
                    <div className="px-4 py-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Salvar na Nuvem</h3>
                        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 font-medium">Google Play Games</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    cloudSignedIn ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {cloudSignedIn ? 'Conectado' : 'Desconectado'}
                                </span>
                            </div>
                            <button
                                onClick={onSyncCloud}
                                className="w-full mt-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                                    <path d="M12 12v9"/>
                                    <path d="m8 17 4-4 4 4"/>
                                </svg>
                                Sincronizar Nuvem
                            </button>
                        </div>
                    </div>

                    <div className="my-2 border-t border-gray-100" />

                    {/* Navigation */}
                    <nav className="flex flex-col gap-1 px-2">
                        <MenuItem icon={<Home size={20} />} label="Voltar ao Início" onClick={() => { onClose(); onGoHome?.(); }} />
                        <MenuItem icon={<HelpCircle size={20} />} label="Help" onClick={onClose} />
                        <MenuItem
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                </svg>
                            }
                            label="Política de Privacidade"
                            onClick={() => {
                                onClose();
                                window.open('/privacy-policy.html', '_blank');
                            }}
                        />
                    </nav>
                </div>


            </div>
        </>
    );
}

function MenuItem({ icon, label, onClick, active }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 p-3 rounded-xl w-full text-left transition-all ${active
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
        >
            <span className={active ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
            <span className="font-semibold">{label}</span>
        </button>
    );
}

function ToggleItem({ icon, label, value, onToggle }) {
    // value: 0 (Off), 0.5 (Low), 1 (High)

    // Determine visuals
    let bgClass = 'bg-gray-300';
    let translateClass = 'translate-x-0';

    if (value === 1) {
        bgClass = 'bg-green-500';
        translateClass = 'translate-x-5';
    } else if (value === 0.5) {
        bgClass = 'bg-yellow-400';
        translateClass = 'translate-x-2.5'; // Middle
    }

    return (
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 text-gray-600">
                {icon}
                <span className="font-medium text-sm">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 w-6 text-right">
                    {value === 0 ? 'OFF' : (value === 0.5 ? '50%' : 'MAX')}
                </span>
                <button
                    onClick={onToggle}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${bgClass}`}
                >
                    <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${translateClass}`}
                    />
                </button>
            </div>
        </div>
    );
}
