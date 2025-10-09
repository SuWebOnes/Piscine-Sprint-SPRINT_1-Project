// ======================
// IMPORTS
// ======================
// Import helper functions for user and data handling
import { getUserIds } from "./common.mjs";
import { getData, addData } from "./storage.mjs";

// ======================
// HELPER FUNCTIONS
// ======================

// ✅ Safe month addition function — handles month rollovers (e.g., Jan 31 + 1 month → Feb 29 or Mar 2)
const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

// ======================
// REVISION DATE CALCULATION (Req. 7 + 9)
// ======================

// ✅ Handles both future and past start dates correctly
export function calculateRevisionDates(startDate) {
  const today = new Date(); // Current date (today)
  const start = new Date(startDate); // The selected start date

  // Revision schedule pattern (label + time offset)
  const schedule = [
    { label: "1 Week", offsetDays: 7 },
    { label: "1 Month", offsetMonths: 1 },
    { label: "3 Months", offsetMonths: 3 },
    { label: "6 Months", offsetMonths: 6 },
    { label: "1 Year", offsetMonths: 12 },
  ];

  // Generate revision dates based on start date
  const revisions = schedule.map((rev) => {
    let date;
    if (rev.offsetDays) {
      // For week offset, add days in milliseconds
      date = new Date(start.getTime() + rev.offsetDays * 24 * 60 * 60 * 1000);
    } else {
      // For month offsets, use safe month addition
      date = addMonths(start, rev.offsetMonths);
    }
    return { label: rev.label, date };
  });

  // Handle edge cases:
  // - Skip the 1-week revision if it’s in the past
  // - Adjust all past revision dates when the start date is in the past
  const validRevisions = revisions
    .filter((rev, index) => !(index === 0 && rev.date < today))
    .map((rev, index) => {
      let finalDate = rev.date;

      // If the selected start date is in the past → move timeline forward from today
      if (start < today && rev.date < today) {
        // These offsets follow the "1 month ago" rule: show Today, +2M, +5M, +11M
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

// PAGE INITIALIZATION

window.onload = function () {
  // Fetch all user IDs dynamically (Req. 1)
  const users = getUserIds();

  // FORM CREATION (Req. 5)


  const form = document.createElement("form");
  form.id = "topic-form";

  // --- Topic Label ---
  const topicLabel = document.createElement("label");
  topicLabel.textContent = "Topic Name:";
  topicLabel.htmlFor = "topic";
  form.appendChild(topicLabel);

  // --- Topic Input Field ---
  const topicInput = document.createElement("input");
  topicInput.type = "text";
  topicInput.id = "topic";
  topicInput.placeholder = "Enter topic name";
  topicInput.name = "topic";
  topicInput.required = true;
  form.appendChild(topicInput);

  // --- Date Label ---
  const dateLabel = document.createElement("label");
  dateLabel.textContent = "Start Date:";
  dateLabel.htmlFor = "date";
  form.appendChild(dateLabel);

  // --- Date Picker ---
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.id = "date";
  dateInput.name = "date";
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today; // Default = today
  dateInput.required = true;
  form.appendChild(dateInput);

  // --- Submit Button ---
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Add Topic";
  form.appendChild(submitBtn);

  // --- Message Paragraph (Accessible) ---
  const message = document.createElement("p");
  message.setAttribute("aria-live", "polite"); // Screen readers announce changes
  form.appendChild(message);

  // USER DROPDOWN (Req. 1 + 8)

  // --- User Label ---
  const userLabel = document.createElement("label");
  userLabel.textContent = "Select User:";
  userLabel.htmlFor = "user-select";

  // --- Select Dropdown ---
  const userSelect = document.createElement("select");
  userSelect.id = "user-select";
  userSelect.setAttribute("aria-label", "Select a user");
  userSelect.required = true;

  // Default placeholder option
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Select a user...";
  defaultOption.value = "";
  userSelect.appendChild(defaultOption);

  // Populate dropdown from imported data
  users.forEach((id) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = "User " + id;
    userSelect.appendChild(option);
  });

  // Wrap label + dropdown for consistent spacing
  const userContainer = document.createElement("div");
  userContainer.appendChild(userLabel);
  userContainer.appendChild(userSelect);

  // AGENDA DISPLAY (Req. 8)

  const agendaDiv = document.createElement("div");
  agendaDiv.id = "agenda";
  agendaDiv.setAttribute("role", "region");
  agendaDiv.setAttribute("aria-live", "polite");

  // --- Function to Update Agenda for Each User ---
  function updateAgenda(userId) {
    agendaDiv.innerHTML = ""; // Reset content

    // Skip if no user selected
    if (!userId) return;

    const data = getData(userId);
    if (!data || data.length === 0) {
      agendaDiv.textContent = "This user has no agenda yet.";
      return;
    }

    const todayDate = new Date();

    // Filter + adjust any past items to show as “today”
    const upcoming = data
      .map((item) => ({
        ...item,
        displayDate:
          new Date(item.date) < todayDate
            ? todayDate.toISOString().split("T")[0]
            : item.date,
      }))
      .sort((a, b) => new Date(a.displayDate) - new Date(b.displayDate)); // Sort by nearest date first

    if (upcoming.length === 0) {
      agendaDiv.textContent = "No upcoming topics to revise.";
      return;
    }

    // --- Agenda Header ---
    const title = document.createElement("h3");
    title.textContent = "Agenda for User " + userId;
    agendaDiv.appendChild(title);

    // --- Agenda List ---
    const list = document.createElement("ul");
    upcoming.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.displayDate} — ${item.topic} (${item.label})`;
      list.appendChild(li);
    });
    agendaDiv.appendChild(list);
  }

  // FORM SUBMISSION LOGIC (Req. 7 + 8)

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Stop default refresh
    message.textContent = "";

    const topic = topicInput.value.trim();
    const date = dateInput.value;
    const userId = userSelect.value;

    // Validate inputs
    if (!topic || !date || !userId) {
      message.textContent = "Please enter topic, date and select a user!";
      message.style.color = "red";
      return;
    }

    //  Calculate revisions and save them
    const revisions = calculateRevisionDates(date);
    const entries = revisions.map((r) => ({
      topic,
      date: r.date,
      label: r.label,
    }));

    addData(userId, entries); // Save to storage
    updateAgenda(userId); // Refresh user’s agenda

    // Show confirmation
    message.textContent = `Topic "${topic}" added successfully!`;
    message.style.color = "green";

    // Reset form for new entry
    topicInput.value = "";
    dateInput.value = today;
  });

  // When a user is selected → load their agenda immediately
  userSelect.addEventListener("change", () => {
    updateAgenda(userSelect.value);
  });

  
  // PAGE WRAPPER (Req. 10 Accessibility)
  

  const wrapper = document.createElement("div");
  wrapper.id = "app-wrapper";
  wrapper.setAttribute("role", "main"); // Main landmark for screen readers

  // Apply consistent spacing and touch target size
  wrapper.style.fontSize = "16px"; // Readable text
  wrapper.style.lineHeight = "1.6"; // Comfortable line height
  wrapper.style.padding = "20px"; // Content padding
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "15px"; // Even spacing between sections

  // Append everything neatly inside wrapper
  wrapper.appendChild(userContainer);
  wrapper.appendChild(form);
  wrapper.appendChild(agendaDiv);

  // Finally, add wrapper to the document body
  document.body.appendChild(wrapper);
};
