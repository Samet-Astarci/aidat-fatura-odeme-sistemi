import { qs } from "./common.js";

export function mountNav(){
  const el = qs("#nav");
  if (!el) return;
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  const links = user?.role === "admin"
    ? [
        ["Yönetici Paneli","/admin/index.html"],
        ["Kullanıcılar","/admin/users.html"],
        ["Daireler","/admin/apartments.html"],
        ["Aidat Tanımla","/admin/dues.html"],
        ["Giderler","/admin/expenses.html"],
        ["Duyurular","/admin/announcements.html"],
        ["Rapor","/admin/report.html"],
      ]
    : [
        ["Sakin Paneli","/resident/index.html"],
        ["Ödeme Yap","/resident/pay.html"],
      ];

  const html = `
    <div class="nav">
      <div class="brand"><span class="dot"></span> Site Aidat Takip</div>
      <div class="right">
        ${user ? `<span class="pill">${user.name} • ${user.role === "admin" ? "Yönetici" : "Sakin"}</span>` : ""}
        ${links.map(([t,h])=>`<a class="pill" href="${h}">${t}</a>`).join("")}
        ${user ? `<button id="btnLogout" class="btn-ghost">Çıkış</button>` : ""}
      </div>
    </div>
  `;
  el.innerHTML = html;

  const btn = qs("#btnLogout");
  if (btn){
    btn.addEventListener("click", async ()=>{
      try{
        const token = localStorage.getItem("token");
        if (token){
          await fetch("/api/auth/logout", { method:"POST", headers: { "Authorization":"Bearer "+token } });
        }
      }catch(e){}
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      location.href="/index.html";
    });
  }
}

export function toast(msg, detail=""){
  const old = qs("#toast");
  if (old) old.remove();
  const el = document.createElement("div");
  el.id="toast";
  el.className="toast";
  el.innerHTML = `<div>${msg}</div>${detail ? `<div class="small">${detail}</div>`:""}`;
  document.body.appendChild(el);
  setTimeout(()=>{ el.remove(); }, 3600);
}