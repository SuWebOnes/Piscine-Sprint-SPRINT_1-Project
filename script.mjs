// ======================
// IMPORTS
// ======================
// Import helper functions for user and data handling
import { getUserIds } from "./common.mjs";
import { getData, addData } from "./storage.mjs";

// ======================
// HELPER FUNCTIONS
// ======================

// ✅ Safe month addition function — handles month rollovers
const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

// ======================
// REVISION DATE CALCULATION (Req. 7 + 9)
// ======================
export function calculateRevisionDates(startDate) {
  const today = new Date();
  const start = new Date(startDate);

  const schedule = [
    { label: "1 Week", offsetDays: 7 },
    { label: "1 Month", offsetMonths: 1 },
    { label: "3 Months", offsetMonths: 3 },
    { label: "6 Months", offsetMonths: 6 },
    { label: "1 Year", offsetMonths: 12 },
  ];

  const revisions = schedule.map((rev, index) => {
    let date;
    if (rev.offsetDays) {
      date = new Date(start.getTime() + rev.offsetDays * 24 * 60 * 60 * 1000);
    } else {
      date = addMonths(start, rev.offsetMonths);
    }

    // Adjust if start date is in the past
    if (start < today && date < today) {
      const monthsToAdd = [0, 2, 5, 11];
      date = addMonths(today, monthsToAdd[index] || 0);
    }

    return {
      label: rev.label,
      date: date.toISOString().split("T")[0],
    };
  });

  // Skip 1-week if in past
  return revisions.filter((rev, index) => !(index === 0 && new Date(rev.date) < today));
}

// ======================
// PAGE INITIALISATION
// ======================
window.onload = function () {
  const users = getUserIds();
  const today = new Date().toISOString().split("T")[0];

  // Helper to wrap label + input in flex container
  const wrap = (label, input) => {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.marginBottom = "10px";
    container.appendChild(label);
    container.appendChild(input);
    return container;
  };

  // FORM CREATION
  const form = document.createElement("form");
  form.id = "topic-form";

  // Topic input
  const topicLabel = document.createElement("label");
  topicLabel.textContent = "Topic Name:";
  topicLabel.htmlFor = "topic";

  const topicInput = document.createElement("input");
  topicInput.type = "text";
  topicInput.id = "topic";
  topicInput.name = "topic";
  topicInput.placeholder = "Enter topic name";
  topicInput.required = true;

  // Date input
  const dateLabel = document.createElement("label");
  dateLabel.textContent = "Start Date:";
  dateLabel.htmlFor = "date";

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.id = "date";
  dateInput.name = "date";
  dateInput.value = today;
  dateInput.required = true;

  // User dropdown
  const userLabel = document.createElement("label");
  userLabel.textContent = "Select User:";
  userLabel.htmlFor = "user-select";

  const userSelect = document.createElement("select");
  userSelect.id = "user-select";
  userSelect.setAttribute("aria-label", "Select a user");
  userSelect.required = true;

  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Select a user...";
  defaultOption.value = "";
  userSelect.appendChild(defaultOption);

  users.forEach((id) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = "User " + id;
    userSelect.appendChild(option);
  });

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Add Topic";

  // Validation message
  const message = document.createElement("p");
  message.setAttribute("aria-live", "polite");

  // Append form elements wrapped in flex containers
  form.appendChild(wrap(topicLabel, topicInput));
  form.appendChild(wrap(dateLabel, dateInput));
  form.appendChild(wrap(userLabel, userSelect));
  form.appendChild(submitBtn);
  form.appendChild(message);

  // Agenda container
  const agendaDiv = document.createElement("div");
  agendaDiv.id = "agenda";
  agendaDiv.setAttribute("role", "region");
  agendaDiv.setAttribute("aria-live", "polite");

  // Function to update agenda
  const updateAgenda = (userId) => {
    agendaDiv.innerHTML = "";
    if (!userId) return;

    const data = getData(userId);
    if (!data || data.length === 0) {
      agendaDiv.textContent = "This user has no agenda yet.";
      return;
    }

    const todayDate = new Date();
    const upcoming = data
      .map((item) => ({
        ...item,
        displayDate:
          new Date(item.date) < todayDate
            ? todayDate.toISOString().split("T")[0]
            : item.date,
      }))
      .sort((a, b) => new Date(a.displayDate) - new Date(b.displayDate));

    if (upcoming.length === 0) {
      agendaDiv.textContent = "No upcoming topics to revise.";
      return;
    }

    const title = document.createElement("h3");
    title.textContent = "Agenda for User " + userId;
    agendaDiv.appendChild(title);

    const list = document.createElement("ul");
    upcoming.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.displayDate} — ${item.topic} (${item.label})`;
      list.appendChild(li);
    });
    agendaDiv.appendChild(list);
  };

  // Form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    message.textContent = "";

    const topic = topicInput.value.trim();
    const date = dateInput.value;
    const userId = userSelect.value;

    if (!topic || !date || !userId) {
      message.textContent = "Please enter topic, date and select a user!";
      message.style.color = "red";
      return;
    }

    const revisions = calculateRevisionDates(date);
    const entries = revisions.map((r) => ({
      topic,
      date: r.date,
      label: r.label,
    }));

    addData(userId, entries);
    updateAgenda(userId);

    message.textContent = `Topic "${topic}" added successfully!`;
    message.style.color = "green";

    topicInput.value = "";
    dateInput.value = today;
  });

  // Update agenda when user changes
  userSelect.addEventListener("change", () => {
    updateAgenda(userSelect.value);
  });

  // PAGE WRAPPER
  const wrapper = document.createElement("div");
  wrapper.id = "app-wrapper";
  wrapper.setAttribute("role", "main");
  wrapper.style.fontSize = "16px";
  wrapper.style.lineHeight = "1.6";
  wrapper.style.padding = "20px";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "15px";

  wrapper.appendChild(form);
  wrapper.appendChild(agendaDiv);

  document.body.appendChild(wrapper);
};
