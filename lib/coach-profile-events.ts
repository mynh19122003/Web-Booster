const eventName = "coach-profile-updated";
const storageKey = "ascend-coach-profile-revision";

export function notifyCoachProfileUpdated() {
  window.dispatchEvent(new Event(eventName));
  try { localStorage.setItem(storageKey, crypto.randomUUID()); } catch {}
}

export function subscribeCoachProfileUpdates(refresh: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) refresh();
  };
  window.addEventListener(eventName, refresh);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(eventName, refresh);
    window.removeEventListener("storage", onStorage);
  };
}
