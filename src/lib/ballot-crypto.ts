const toBase64Url = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

function importRsaPublicKey(pem: string) {
  const bytes = Uint8Array.from(atob(pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, "")), (char) => char.charCodeAt(0));
  return crypto.subtle.importKey("spki", bytes, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
}

export async function encryptBallot(publicKeyPem: string, electionId: string, choices: Record<string, string>) {
  const publicKey = await importRsaPublicKey(publicKeyPem);
  const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = new TextEncoder().encode(JSON.stringify({ electionId, choices }));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, payload);
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const wrappedKey = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, rawAesKey);
  return JSON.stringify({
    version: "RSA-OAEP-256+A256GCM",
    wrappedKey: toBase64Url(wrappedKey),
    iv: toBase64Url(iv.buffer),
    ciphertext: toBase64Url(ciphertext),
  });
}
