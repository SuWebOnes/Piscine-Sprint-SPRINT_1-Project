import { getUserIds } from './common.mjs';
import { getData, saveData } from './storage.mjs'; // Added saveData import

window.onload = function () {
  const users = getUserIds();

  // Create the form
  const form = document.createElement('form');

  // Text input for topic name
  const topicInput = document.createElement('input');
  topicInput.type = 'text';
  topicInput.placeholder = 'Enter topic name';
  topicInput.name = 'topic';
  form.appendChild(topicInput);

  // Date picker input
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.name = 'date';

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  dateInput.min = today; // Prevents past dates

  form.appendChild(dateInput);

  // Dropdown for user selection (needed for storing data)
  const userSelect = document.createElement('select');
  userSelect.id = 'user-select';

  const defaultOption = document.createElement('option');
  defaultOption.textContent = 'Select a user...';
  defaultOption.value = '';
  userSelect.appendChild(defaultOption);

  users.forEach(id => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = 'User ' + id;
    userSelect.appendChild(option);
  });

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Add Topic';
  form.appendChild(submitBtn);

  // Validation message area
  const message = document.createElement('p');
  form.appendChild(message);

  // Agenda display container
  const agendaDiv = document.createElement('div');
  agendaDiv.id = 'agenda';

  // ----------------------------------------------
  //  Helper — Calculate Revision Dates
  // ----------------------------------------------
  function calculateRevisionDates(startDate) {
    const base = new Date(startDate);
    const revisions = [
      { label: '1 Week', date: new Date(base.setDate(base.getDate() + 7)) },
      {
        label: '1 Month',
        date: new Date(
          new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)
        ),
      },
      {
        label: '3 Months',
        date: new Date(
          new Date(startDate).setMonth(new Date(startDate).getMonth() + 3)
        ),
      },
      {
        label: '6 Months',
        date: new Date(
          new Date(startDate).setMonth(new Date(startDate).getMonth() + 6)
        ),
      },
      {
        label: '1 Year',
        date: new Date(
          new Date(startDate).setFullYear(new Date(startDate).getFullYear() + 1)
        ),
      },
    ];
    return revisions.map(r => ({
      label: r.label,
      date: r.date.toISOString().split('T')[0],
    }));
  }

  // ----------------------------------------------
  // Form Submission Handler (includes saved date)
  // ----------------------------------------------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    message.textContent = '';

    const topicValue = topicInput.value.trim();
    const dateValue = dateInput.value;
    const selectedUserId = userSelect.value;

    // Check if all fields are filled
    if (!topicValue || !dateValue || !selectedUserId) {
      message.textContent =
        'Please select a user, enter a topic name, and a date.';
      message.style.color = 'red';
      return;
    }

    // STEP 7: Generate revision dates
    const revisionDates = calculateRevisionDates(dateValue);

    // STEP 7: Prepare data for saving
    const newEntries = revisionDates.map(r => ({
      topic: topicValue,
      date: r.date,
      label: r.label,
    }));

    //  Save to storage
    saveData(selectedUserId, newEntries);

    //  Update agenda display immediately
    updateAgenda(selectedUserId);
    // Keep current user selected so agenda stays visible
    userSelect.value = selectedUserId;

    // Confirmation message
    message.textContent = `Topic "${topicValue}" added successfully with revision dates!`;
    message.style.color = 'green';

    // Reset input fields
    topicInput.value = '';
    dateInput.value = new Date().toISOString().split('T')[0]; // keep default as today
  });

  // ----------------------------------------------
  //  Agenda Display (Refactored into function)
  // ----------------------------------------------
  function updateAgenda(userId) {
    agendaDiv.innerHTML = '';
    if (!userId) return;

    const userData = getData(userId);

    if (!userData || userData.length === 0) {
      agendaDiv.textContent = 'This user has no agenda yet.';
      return;
    }

    const today = new Date();
    const upcomingData = userData.filter(item => new Date(item.date) >= today);

    if (upcomingData.length === 0) {
      agendaDiv.textContent = 'No upcoming topics to revise.';
      return;
    }

    // Sort by date
    upcomingData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const title = document.createElement('h3');
    title.textContent = 'Agenda for User ' + userId;
    agendaDiv.appendChild(title);

    const list = document.createElement('ul');
    upcomingData.forEach(item => {
      const listItem = document.createElement('li');
      listItem.textContent = `${item.date} — ${item.topic} (${item.label})`; // STEP 7: Added label
      list.appendChild(listItem);
    });
    agendaDiv.appendChild(list);
  }

  // Dropdown change event
  userSelect.addEventListener('change', function () {
    const selectedUserId = userSelect.value;
    updateAgenda(selectedUserId);
  });

  // Append all to DOM
  document.body.appendChild(form);
  document.body.appendChild(userSelect);
  document.body.appendChild(agendaDiv);
};
