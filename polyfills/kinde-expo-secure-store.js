import * as SecureStore from "expo-secure-store";

const StorageKeys = {
  accessToken: "accessToken",
  idToken: "idToken",
  refreshToken: "refreshToken",
  state: "state",
  nonce: "nonce",
  codeVerifier: "codeVerifier",
};

const storageSettings = {
  keyPrefix: "kinde-",
  maxLength: 2000,
};

function splitString(value, chunkSize) {
  return value.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [];
}

export class ExpoSecureStore {
  asyncStore = true;
  listeners = new Set();
  notificationScheduled = false;

  async scheduleNotification() {
    if (this.notificationScheduled) return;
    this.notificationScheduled = true;
    await new Promise((resolve) => {
      setTimeout(async () => {
        await Promise.all(Array.from(this.listeners).map((listener) => listener()));
        this.notificationScheduled = false;
        resolve();
      }, 0);
    });
  }

  notifyListeners() {
    if (this.listeners.size !== 0) {
      this.scheduleNotification();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async destroySession() {
    const keys = Object.values(StorageKeys);
    await Promise.all(keys.map((key) => this.removeSessionItem(key)));
    this.notifyListeners();
  }

  async setSessionItem(key, value) {
    await this.removeSessionItem(key);
    if (typeof value !== "string") {
      throw new Error("Item value must be a string");
    }
    const parts = splitString(value, Math.min(storageSettings.maxLength, 2048));
    await Promise.all(
      parts.map((chunk, idx) =>
        SecureStore.setItemAsync(`${storageSettings.keyPrefix}${key}${idx}`, chunk),
      ),
    );
    this.notifyListeners();
  }

  async getSessionItem(key) {
    const parts = [];
    let idx = 0;
    let piece = await SecureStore.getItemAsync(`${storageSettings.keyPrefix}${String(key)}${idx}`);
    while (piece) {
      parts.push(piece);
      idx += 1;
      piece = await SecureStore.getItemAsync(`${storageSettings.keyPrefix}${String(key)}${idx}`);
    }
    return parts.join("") || null;
  }

  async removeSessionItem(key) {
    let idx = 0;
    let piece = await SecureStore.getItemAsync(`${storageSettings.keyPrefix}${String(key)}${idx}`);
    while (piece) {
      await SecureStore.deleteItemAsync(`${storageSettings.keyPrefix}${String(key)}${idx}`);
      idx += 1;
      piece = await SecureStore.getItemAsync(`${storageSettings.keyPrefix}${String(key)}${idx}`);
    }
    this.notifyListeners();
  }
}
