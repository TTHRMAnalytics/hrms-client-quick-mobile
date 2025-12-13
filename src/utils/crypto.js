// src/utils/crypto.js

import * as CryptoJS from "crypto-js";
import Config from "react-native-config";

// These MUST match the web .env values:
// REACT_APP_SIGN_IN_SECRET  -> SIGN_IN_SECRET
// REACT_APP_SIGN_IN_INITIAL_VECTOR -> SIGN_IN_INITIAL_VECTOR
const SECRET = Config.SIGN_IN_SECRET;
const IV = Config.SIGN_IN_INITIAL_VECTOR;

export function encryptPassword(data) {

  const key = CryptoJS.enc.Utf8.parse(SECRET);
  const iv = CryptoJS.enc.Utf8.parse(IV);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    // padding defaults to Pkcs7 in web too,
    // but we can make it explicit:
//    padding: CryptoJS.pad.Pkcs7,
  });

  const base64 = encrypted.toString(); // SAME as web: password.toString()

  return base64;
}
