export function getToken(){
  return localStorage.getItem("token");
}
export function setToken(t){
  localStorage.setItem("token", t);
}
export function clearToken(){
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
export function getUser(){
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}
export function setUser(u){
  localStorage.setItem("user", JSON.stringify(u));
}
export function isAuthed(){
  return !!getToken();
}
export async function api(path, opts={}){
  const headers = opts.headers || {};
  headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(()=> ({}));
  if (!res.ok) {
    const msg = data && data.error ? data.error : "İşlem başarısız.";
    throw new Error(msg);
  }
  return data;
}
export function fmtTL(n){
  const v = Number(n||0);
  return v.toLocaleString("tr-TR", { style:"currency", currency:"TRY" });
}
export function qs(sel){ return document.querySelector(sel); }
export function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

export function requireAuth(role=null){
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    location.href = "/index.html";
    return;
  }
  if (role && user.role !== role){
    location.href = "/index.html";
    return;
  }
}