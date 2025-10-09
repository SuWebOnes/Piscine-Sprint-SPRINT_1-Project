// ======================
// IMPORTS
// ======================
import { getUserIds } from "./common.mjs";
import { getData, addData } from "./storage.mjs";

// ======================
// HELPER FUNCTIONS
// ======================

// Safe month addition function — handles month rollovers
const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

// Calculate revision dates (Req. 7 + 9)
export function calculateRevisionDates(startDate) {
  const today = new Date();
  const start = new Date(startDate);

  // Revision schedule
  const schedule = [
    { label: "1 Week", offsetDays: 7 },
    { label: "1 Month", offsetMonths: 1 },
    { label: "3 Months", offsetMonths: 3 },
    { label: "6 Months", offsetMonths: 6 },
    { label: "1 Year", offsetMonths: 12 },
  ];

  const revisions = schedule.map((rev) => {
    let date;
    if (rev.offsetDays) {
      date = new Date(start.getTime() + rev.offsetDays * 24 * 60 * 60 * 1000);
    } else {
      date = addMonths(start, rev.offsetMonths);
    }
    return { label: rev.label, date };
  });

  // Filter & adjust past dates
  const validRevisions = revisions
    .filter((rev, index) => !(index === 0 && rev.date < today)) // skip 1-week if past
    .map((rev, index) => {
      let finalDate = rev.date;
      if (start < today && rev.date < today) {
        // Adjust timeline from today: Today, +2M, +5M, +11M
        const monthsToAdd = [0, 2, 5, 11];
        finalDate = addMonths(today, monthsToAdd[index] || 0);
      }
      return {
        label: rev.label,
        date: finalDate.toISOString().split("T")[0], // Format YYYY-MM-DD
      };
    });

  return validRevisions;
}

// ======================
// PAGE INITIALISATION
// ======================
window.onload = function () {
  const users = getUserIds();

  // ----------------------
  // FORM CREATION
  // ----------------------
  const form = document.createElement("form");
  form.id = "topic-form";

  const topicLabel = document.createElement("label");
  topicLabel.textContent = "Topic Name:";
  topicLabel.htmlFor = "topic";

  const topicInput = document.createElement("input");
  topicInput.type = "text";
  topicInput.id = "topic";
  topicInput.name = "topic";
  topicInput.placeholder = "Enter topic name";
  topicInput.required = true;

  const dateLabel = document.createElement("label");
  dateLabel.textContent = "Start Date:";
  dateLabel.htmlFor = "date";

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.id = "date";
  dateInput.name = "date";
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
  dateInput.required = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Add Topic";

  const message = document.createElement("p");
  message.setAttribute("aria-live", "polite");

  // ★ Wrap form elements in flex container for uniform widths
  const inputWrapper = document.createElement("div");
  inputWrapper.style.display = "flex";
  inputWrapper.style.flexDirection = "column";
  inputWrapper.style.gap = "10px";
  [topicLabel, topicInput, dateLabel, dateInput, submitBtn, message].forEach(el => {
    inputWrapper.appendChild(el);
    if (el.tagName === "INPUT" || el.tagName === "BUTTON") {
      el.style.width = "100%";
      el.style.padding = "10px";
      el.style.fontSize = "16px";
      el.style.boxSizing = "border-box";
    }
  });

  form.appendChild(inputWrapper);

  // ----------------------
  // USER DROPDOWN
  // ----------------------
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

  // ★ Wrap label + select in flex container
  const userContainer = document.createElement("div");
  userContainer.style.display = "flex";
  userContainer.style.flexDirection = "column";
  userContainer.style.gap = "5px";
  userContainer.appendChild(userLabel);
  userContainer.appendChild(userSelect);
  userSelect.style.width = "100%";
  userSelect.style.padding = "10px";
  userSelect.style.fontSize = "16px";
  userSelect.style.boxSizing = "border-box";

  // ----------------------
  // AGENDA DISPLAY
  // ----------------------
  const agendaDiv = document.createElement("div");
  agendaDiv.id = "agenda";
  agendaDiv.setAttribute("role", "region");
  agendaDiv.setAttribute("aria-live", "polite");

  function updateAgenda(userId) {
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
  }

  // ----------------------
  // FORM SUBMISSION
  // ----------------------
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

  userSelect.addEventListener("change", () => {
    updateAgenda(userSelect.value);
  });

  // ----------------------
  // PAGE WRAPPER
  // ----------------------
  const wrapper = document.createElement("div");
  wrapper.id = "app-wrapper";
  wrapper.setAttribute("role", "main");
  wrapper.style.fontSize = "16px";
  wrapper.style.lineHeight = "1.6";
  wrapper.style.padding = "20px";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "15px";

  wrapper.appendChild(userContainer);
  wrapper.appendChild(form);
  wrapper.appendChild(agendaDiv);

  document.body.appendChild(wrapper);
};
