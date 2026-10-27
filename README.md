# skillhalflife.com

Website for skillhalflife.com: a personal career plan for people whose jobs are changing because of AI. It is the paid next step after the free [Job Exposure Index](https://jobexposureindex.com) ([repo](https://github.com/JthP-JohnnyBlu-Eyes/jobexposureindex)).

Right now the site is a waitlist page: a free 10-second job check (exposure score from the Job Exposure Index), why it matters now, a sample plan, the $33 launch price and an email signup. The questionnaire, checkout and plan delivery come later, once the waitlist shows enough demand.

The site is plain static HTML, served by a Cloudflare Worker like the Job Exposure Index. `wrangler.jsonc` attaches skillhalflife.com and www.skillhalflife.com as custom domains, and the Worker redirects www to the bare domain.

## Setup

1. **Kit waitlist form.** Signups go to Kit form 10104914 ("SkillHalfLife waitlist", separate from the JEI weekly report form). To use another form, change that number in `public/index.html` (two places). Add a Kit custom field called `job` to record which JEI job page a signup came from.
2. **Deploy.** In Cloudflare, go to Workers & Pages, Create, Import a repository, and pick this repo. Every push to `main` then deploys.
3. **Email.** Turn on Cloudflare Email Routing for skillhalflife.com and forward `hello@skillhalflife.com` to your inbox.
4. **Analytics.** In Cloudflare, open Web Analytics, add skillhalflife.com and choose the automatic setup. It is free and uses no cookies.

## The Job Exposure Index handoff

Every JEI job page links here as `https://skillhalflife.com/?job=<slug>&utm_source=jobexposureindex&utm_medium=job_page`. `public/assets/waitlist.js` opens the job check on that job's result and sends the slug to Kit with the signup, so you can see which jobs the waitlist comes from.

The job check reads `public/data/jobs.json`, a copy of JEI's public job list. `.github/workflows/sync-jobs.yml` refreshes it every Monday after the JEI data refresh.
