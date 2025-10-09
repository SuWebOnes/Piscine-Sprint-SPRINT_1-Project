import { getUserIds } from './common.mjs';
import { getData, addData } from './storage.mjs';


// Helper: Calculate revision dates (Req. 7 + testable for Req. 9)

export function calculateRevisionDates(startDate) {
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

// Page Initialization

window.onload = function () {
  const users = getUserIds();

  // Create the form (Req. 5)

  const form = document.createElement('form');
  form.id = 'topic-form';

  const topicLabel = document.createElement('label');
  topicLabel.textContent = 'Topic Name:';
  topicLabel.htmlFor = 'topic';
  form.appendChild(topicLabel);

  const topicInput = document.createElement('input');
  topicInput.type = 'text';
  topicInput.id = 'topic';
  topicInput.placeholder = 'Enter topic name';
  topicInput.name = 'topic';
  topicInput.required = true;
  form.appendChild(topicInput);

  // Text input for topic name

  const dateLabel = document.createElement('label');
  dateLabel.textContent = 'Start Date:';
  dateLabel.htmlFor = 'date';
  form.appendChild(dateLabel);

  // Date picker input

  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.id = 'date';
  dateInput.name = 'date';
  const today = new Date().toISOString().split('T')[0]; // today as a default date
  dateInput.value = today;
  dateInput.min = today;
  dateInput.required = true;
  form.appendChild(dateInput);

  // Submit button

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Add Topic';
  form.appendChild(submitBtn);

  // Validation message area

  const message = document.createElement('p');
  message.setAttribute('aria-live', 'polite'); // Accessibility (Req. 10)
  form.appendChild(message);

  // User Dropdown (Req. 1 + 8)
  
  const userLabel = document.createElement('label');
  userLabel.textContent = 'Select User:';
  userLabel.htmlFor = 'user-select';
  document.body.appendChild(userLabel);

  const userSelect = document.createElement('select');
  userSelect.id = 'user-select';
  userSelect.setAttribute('aria-label', 'Select a user');
  userSelect.required = true;

  const defaultOption = document.createElement('option');
  defaultOption.textContent = 'Select a user...';
  defaultOption.value = '';
  userSelect.appendChild(defaultOption);

  // Populate dropdown

  users.forEach(id => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = 'User ' + id;
    userSelect.appendChild(option);
  });

  // Agenda Display (Req. 8)

  const agendaDiv = document.createElement('div');
  agendaDiv.id = 'agenda';
  agendaDiv.setAttribute('role', 'region');
  agendaDiv.setAttribute('aria-live', 'polite');

  function updateAgenda(userId) {
    agendaDiv.innerHTML = '';
    if (!userId) return;

    const data = getData(userId);
    if (!data || data.length === 0) {
      agendaDiv.textContent = 'This user has no agenda yet.';
      return;
    }

    // Filter out past dates

    const today = new Date();
    const upcoming = data.filter(item => new Date(item.date) >= today);
    
    // Sort by date

    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcoming.length === 0) {
      agendaDiv.textContent = 'No upcoming topics to revise.';
      return;
    }

    const title = document.createElement('h3');
    title.textContent = 'Agenda for User ' + userId;
    agendaDiv.appendChild(title);

    const list = document.createElement('ul');
    upcoming.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.date} — ${item.topic} (${item.label})`;
      list.appendChild(li);
    });
    agendaDiv.appendChild(list);
  }

  // Form Submission (Req. 7 + 8)
  
  form.addEventListener('submit', e => {
    e.preventDefault();
    message.textContent = '';

    const topic = topicInput.value.trim();
    const date = dateInput.value;
    const userId = userSelect.value;

    if (!topic || !date || !userId) {
      message.textContent = 'Please enter topic, date and select a user!';
      message.style.color = 'red';
      return;
    }

    const revisions = calculateRevisionDates(date);
    const entries = revisions.map(r => ({
      topic,
      date: r.date,
      label: r.label,
    }));

    // Use addData() instead of saveData()
    addData(userId, entries);

    updateAgenda(userId);
    message.textContent = `Topic "${topic}" added successfully!`;
    message.style.color = 'green';

    topicInput.value = '';
    dateInput.value = today;
  });

  // Update agenda when user changes
  userSelect.addEventListener('change', () => {
    updateAgenda(userSelect.value);
  });

  // Wrapper div for all content
  
  const wrapper = document.createElement("div");
  wrapper.id = "app-wrapper";

  //  main landmark
  wrapper.setAttribute("role", "main");

  // for touch targets & readability
  wrapper.style.fontSize = "16px";       // larger font for readability
  wrapper.style.lineHeight = "1.6";      // spacing between lines
  wrapper.style.padding = "20px";        // padding around content
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "15px";            // spacing between child elements

  // Append existing elements to wrapper
  wrapper.appendChild(form);
  wrapper.appendChild(userSelect);
  wrapper.appendChild(agendaDiv);

  // Append wrapper to body
  document.body.appendChild(wrapper); // Updated append with wrapper
};
