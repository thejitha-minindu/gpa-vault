import { loadJSON, saveJSON } from './storage';

const USERS_KEY = 'gpa-vault-users';
const SESSION_KEY = 'gpa-vault-session';

const toBase64 = buffer => window.btoa(String.fromCharCode(...new Uint8Array(buffer)));

const fromBase64 = value => Uint8Array.from(window.atob(value), c => c.charCodeAt(0));

export const hashPassword = async (password, salt) => {
  const saltBytes = salt instanceof Uint8Array ? salt : fromBase64(salt);
  const saltString = Array.from(saltBytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + saltString));
  return toBase64(digest);
};

const createSalt = () => crypto.getRandomValues(new Uint8Array(16));

export const registerUser = async (username, password) => {
  const users = loadJSON(USERS_KEY, []);
  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Username already exists');
  }
  const salt = createSalt();
  const hash = await hashPassword(password, salt);
  const user = {
    id: crypto.randomUUID(),
    username,
    salt: toBase64(salt.buffer),
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveJSON(USERS_KEY, users);
  return user;
};

export const loginUser = async (username, password) => {
  const users = loadJSON(USERS_KEY, []);
  const user = users.find(item => item.username.toLowerCase() === username.toLowerCase());
  if (!user) throw new Error('Invalid username or password');
  const salt = fromBase64(user.salt);
  const hash = await hashPassword(password, salt);
  if (hash !== user.passwordHash) throw new Error('Invalid username or password');
  saveJSON(SESSION_KEY, { userId: user.id, username: user.username });
  return user;
};

export const logoutUser = () => localStorage.removeItem(SESSION_KEY);

export const getCurrentSession = () => loadJSON(SESSION_KEY, null);

export const saveUserData = (userId, data) => {
  saveJSON(`gpa-vault-data-${userId}`, data);
};

export const loadUserData = userId => loadJSON(`gpa-vault-data-${userId}`, null);
