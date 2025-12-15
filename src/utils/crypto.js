// src/utils/crypto.js
import * as CryptoJS from "crypto-js";
import Config from "react-native-config";

const SECRET = "MEEPL_SK";
const IV = "MEEPL_INIT_VECTOR";

export function encryptPassword(data) {

  const key = CryptoJS.enc.Utf8.parse(SECRET);
  const iv = CryptoJS.enc.Utf8.parse(IV);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv,
    mode: CryptoJS.mode.CBC,
  });

  const base64 = encrypted.toString();

  return base64;
}