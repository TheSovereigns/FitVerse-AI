export function queueOfflineAction(type: string, payload: any) {
  try {
    const q = JSON.parse(localStorage.getItem('vysefit-offline-queue') || '[]');
    q.push({ type, payload, ts: Date.now() });
    localStorage.setItem('vysefit-offline-queue', JSON.stringify(q.slice(-50)));
  } catch {}
}

export function flushOfflineQueue() {
  try {
    const q = JSON.parse(localStorage.getItem('vysefit-offline-queue') || '[]');
    if (!q.length) return;
    // Placeholder: process queued actions when online
    // For now, just clear after attempting flush
    localStorage.removeItem('vysefit-offline-queue');
  } catch {}
}

// Auto-flush when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', flushOfflineQueue);
}
