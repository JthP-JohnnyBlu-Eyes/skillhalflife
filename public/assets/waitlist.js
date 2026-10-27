// The free job check and the waitlist signup.
// Job scores come from /data/jobs.json, a weekly copy of the Job Exposure Index list
// (.github/workflows/sync-jobs.yml). A visitor arriving from a JEI job page has ?job=<slug> in the URL,
// so the check opens on that job's result. The chosen job's slug goes to Kit with the signup (custom field "job").

var jobs = null;
var chosen = null;

function loadJobs() {
  if (jobs) return Promise.resolve(jobs);
  return fetch('/data/jobs.json').then(function (r) { return r.json(); }).then(function (d) { jobs = d; return d; });
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

var input = document.getElementById('job-input');
var list = document.getElementById('job-results');
var stepSearch = document.getElementById('step-search');
var stepResult = document.getElementById('step-result');

var VERDICT = {
  'very-high': 'Very high exposure. AI can already speed up most of this work. Now is the time to plan your next step.',
  'high': 'High exposure. AI can already speed up much of this work. Now is the time to plan your next step.',
  'elevated': 'Elevated exposure. A good part of this work is changing. Plan ahead while you still get to choose.',
  'moderate': 'Moderate exposure. Parts of this work are changing. A plan keeps you ahead of it.',
  'low': 'Low exposure. Most of this work is hard for AI, but the tools around it are changing. A plan keeps you ahead.'
};

function search() {
  var q = input.value.toLowerCase().trim();
  if (q.length < 2) { list.innerHTML = ''; return; }
  loadJobs().then(function (all) {
    var words = q.split(/\s+/);
    var hits = all.filter(function (j) {
      var t = j.t.toLowerCase();
      return words.every(function (w) { return t.indexOf(w) !== -1; });
    }).sort(function (a, b) {
      var sa = a.t.toLowerCase().indexOf(q) === 0 ? 0 : 1, sb = b.t.toLowerCase().indexOf(q) === 0 ? 0 : 1;
      return sa - sb || a.t.length - b.t.length;
    }).slice(0, 6);
    list.innerHTML = hits.length
      ? hits.map(function (j) { return '<li><button type="button" data-slug="' + esc(j.s) + '"><span>' + esc(j.t) + '</span><span class="sc">' + j.x + '/100</span></button></li>'; }).join('')
      : '<li class="empty">No match yet. Try a shorter or more general title.</li>';
  });
}

function show(job) {
  chosen = job;
  var rank = 1 + jobs.filter(function (j) { return j.x > job.x; }).length;
  document.getElementById('r-title').textContent = job.t;
  document.getElementById('r-score').textContent = job.x;
  document.getElementById('r-text').textContent = (VERDICT[job.b] || '') + ' Ranked #' + rank + ' of ' + jobs.length + ' US jobs.';
  document.getElementById('r-src').innerHTML = 'Score from the Job Exposure Index. <a href="https://jobexposureindex.com/jobs/' + esc(job.s) + '">See every task for this job →</a>';
  var pin = document.getElementById('r-pin');
  pin.style.left = '0%';
  stepSearch.hidden = true;
  stepResult.hidden = false;
  requestAnimationFrame(function () { requestAnimationFrame(function () { pin.style.left = Math.max(1, Math.min(99, job.x)) + '%'; }); });
  document.querySelectorAll('form.signup input[name="fields[job]"]').forEach(function (f) { f.value = job.s; });
  try { history.replaceState(null, '', '?job=' + encodeURIComponent(job.s)); } catch (e) {}
}

if (input) {
  input.addEventListener('focus', loadJobs);
  input.addEventListener('input', search);
  list.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-slug]');
    if (!b) return;
    var job = jobs.find(function (j) { return j.s === b.getAttribute('data-slug'); });
    if (job) show(job);
  });
  document.querySelectorAll('.hint button[data-q]').forEach(function (b) {
    b.addEventListener('click', function () { input.value = b.getAttribute('data-q'); search(); input.focus(); });
  });
  document.getElementById('job-change').addEventListener('click', function () {
    stepResult.hidden = true;
    stepSearch.hidden = false;
    input.focus();
  });
}

// Every signup form carries the chosen job, if there is one.
document.querySelectorAll('form.signup').forEach(function (form) {
  var field = document.createElement('input');
  field.type = 'hidden';
  field.name = 'fields[job]';
  form.appendChild(field);
});

var fromUrl = (new URLSearchParams(location.search).get('job') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 120);
if (fromUrl && input) {
  loadJobs().then(function (all) {
    var job = all.find(function (j) { return j.s === fromUrl; });
    if (job) show(job);
  }).catch(function () {});
}

document.querySelectorAll('form.signup').forEach(function (form) {
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
    var job = form.querySelector('input[name="fields[job]"]');
    if (job) job.disabled = !job.value;
    button.disabled = true;
    note.textContent = 'Adding you...';
    fetch(form.action, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
      .then(function (res) {
        if (!res.ok) throw new Error('Signup failed');
        note.textContent = "You're almost on the list. Check your inbox and confirm your email. If you don't see it, look in Spam.";
        form.reset();
      })
      .catch(function () { form.submit(); })
      .finally(function () { button.disabled = false; });
  });
});
