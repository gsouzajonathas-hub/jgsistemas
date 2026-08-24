import { useEffect, useState } from 'react';
import { settingsAPI, SchoolSettings } from '../services/api';

let cache: SchoolSettings | null = null;
const listeners = new Set<(s: SchoolSettings) => void>();

export function pushSettingsCache(s: SchoolSettings) {
  cache = s;
  listeners.forEach(l => l(s));
}

export function parsePaymentMethods(raw?: string): string[] {
  return (raw || 'PIX,Dinheiro,Débito,Crédito')
    .split(',')
    .map(m => m.trim())
    .filter(Boolean);
}

export function useSettings() {
  const [settings, setSettings] = useState<SchoolSettings | null>(cache);

  useEffect(() => {
    const notify = (s: SchoolSettings) => setSettings(s);
    listeners.add(notify);
    if (!cache) {
      settingsAPI.get()
        .then(({ data }) => {
          cache = data;
          listeners.forEach(l => l(data));
        })
        .catch(() => {});
    }
    return () => { listeners.delete(notify); };
  }, []);

  const refresh = async () => {
    const { data } = await settingsAPI.get();
    pushSettingsCache(data);
    return data;
  };

  return {
    settings,
    paymentMethods: parsePaymentMethods(settings?.payment_methods),
    refresh,
  };
}
