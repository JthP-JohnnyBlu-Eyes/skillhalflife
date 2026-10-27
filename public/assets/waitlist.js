// Waitlist signup and the Job Exposure Index handoff.
// A visitor arriving from a JEI job page has ?job=<slug> in the URL: we look up that job in JEI's public
// jobs.json, show its score above the headline, and send the slug to Kit with the signup (custom field "job").

var params = new URLSearchParams(location.search);
var jobSlug = (params.get('job') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 120);

if (jobSlug) {
  fetch('https://jobexposureindex.com/data/jobs.json')
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (jobs) {
      var job = jobs.find(function (j) { return j.s === jobSlug; });
      if (!job) return;
      document.getElementById('jei-score').textContent = job.x + '/100';
      document.getElementById('jei-text').textContent = job.t + ' on the Job Exposure Index';
      document.getElementById('from-jei').classList.add('on');
    })
    .catch(function () {});
}

document.querySelectorAll('form.signup').forEach(function (form) {
  if (jobSlug) {
    var field = document.createElement('input');
    field.type = 'hidden';
    field.name = 'fields[job]';
    field.value = jobSlug;
    form.appendChild(field);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = form.querySelector('input[type=email]');
    var button = form.querySelector('button');
    var note = form.nextElementSibling;
    if (!email.value || !email.checkValidity()) {
      note.textContent = 'Enter a full email address, like you@example.com.';
      email.focus();
      return;
    }
    // Until the Kit waitlist form exists, don't send people to a broken page.
    if (form.action.indexOf('WAITLIST_FORM_ID') !== -1) {
      note.textContent = 'The waitlist opens in a few days. Please check back soon.';
      return;
    }
    button.disabled = true;
    note.textContent = 'Adding you...';
    fetch(form.action, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
      .then(function (res) {
        if (!res.ok) throw new Error('Signup failed');
        note.textContent = 'Almost done. Check your inbox and confirm your email to join the waitlist.';
        form.reset();
      })
      .catch(function () { form.submit(); })
      .finally(function () { button.disabled = false; });
  });
});
