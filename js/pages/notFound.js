import { errorState } from "../ui.js";
export function renderNotFound({ app }) {
  app.innerHTML = errorState({
    title: "Sayfa bulunamadı",
    desc: "Bu route prototipte yok 🤷‍♂️",
    actionHtml: `<a class="btn btn-primary" href="#/dashboard">🏠 Dashboard</a>`
  });
}
