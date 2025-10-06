import { getUserIds } from "./common.mjs";
import { getData } from "./storage.mjs";

window.onload = function () {
  const users = getUserIds();

  // Dropdown
  const userSelect = document.createElement("select");
  userSelect.id = "user-select";

  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Select a user...";
  defaultOption.value = "";
  userSelect.appendChild(defaultOption);

  // Populate dropdown
  users.forEach((id) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = "User " + id;
    userSelect.appendChild(option);
  });

  // Agenda display
  const agendaDiv = document.createElement("div");
  agendaDiv.id = "agenda";

  // Dropdown change event
  userSelect.addEventListener("change", function () {
    const selectedUserId = userSelect.value;
    agendaDiv.innerHTML = "";

    if (selectedUserId === "") {
      return;
    }

    const userData = getData(selectedUserId);

    if (!userData || userData.length === 0) {
      agendaDiv.textContent = "This user has no agenda yet.";
      return;
    }

    const title = document.createElement("h3");
    title.textContent = "Agenda for User " + selectedUserId;
    agendaDiv.appendChild(title);

    const list = document.createElement("ul");

    userData.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = `${item.date} — ${item.topic}`;
      list.appendChild(listItem);
    });

    agendaDiv.appendChild(list);
  });

  document.body.appendChild(userSelect);
  document.body.appendChild(agendaDiv);
};
