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

    // Filter out past dates
    const today = new Date();
    const upcomingData = userData.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= today;
    });

    if (upcomingData.length === 0) {
      agendaDiv.textContent = "No upcoming topics to revise.";
      return;
    }

    // Sort by date
    upcomingData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const title = document.createElement("h3");
    title.textContent = "Agenda for User " + selectedUserId;
    agendaDiv.appendChild(title);

    const list = document.createElement("ul");

    upcomingData.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = `${item.date} — ${item.topic}`;
      list.appendChild(listItem);
    });

    agendaDiv.appendChild(list);
  });

  document.body.appendChild(userSelect);
  document.body.appendChild(agendaDiv);
};
