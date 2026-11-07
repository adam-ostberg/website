---
title: Bolagsrättsligt Forum
date: 2021-03-09
end: 2026-01-01
summary: Designed, built and maintained the website and sign-up form for an annual two-day course in company and securities law.
stack: [HTML, CSS, JavaScript, Firebase]
featured: false
image: /assets/img/BolagsrattsligtForum.jpg
imageAlt: A screenshot of bolagsrattsligtforum.se
links:
  site: https://www.bolagsrattsligtforum.se/
---
{% note %}
Client work, built and run on my own for five years, 2021–2026. The site is in Swedish.
{% endnote %}

## What it is

Bolagsrättsligt Forum runs Bolagsrättsdagarna, a two-day continuing-education course in Swedish company and securities law, held every September at a conference hotel outside Stockholm. The teachers are lawyers who specialise in the field, several of whom also teach at Stockholm University. The website is where people find information about the course and sign up for it.

## How it works

- **Static pages.** Plain HTML, CSS and JavaScript, with no framework. A site like this doesn't need one, and the client's regular web host can serve it as is.
- **Sign-up form.** It collects contact and invoice details, dietary needs and a hotel booking. Sections appear only when they apply: the allergy options show up if you need special food, and the field for a roommate's name appears only if you book a shared double room. Discount codes are supported too.
- **Storing sign-ups.** Registrations go straight from the browser to Firebase Firestore, so there's no server to run or keep patched.
- **Privacy.** The form collects personal data, so it includes a privacy policy and booking terms that people have to accept before they can sign up.

## Running it every year

Before each course I update the dates, programme, prices and hotel rates. Over the years the organisers have received sign-ups in two ways: as an automated email for each new registration, and through an admin dashboard in Firebase where they can see every registration in one place.

## What I learned

- **Production is different from coursework.** People book their course place and hotel room through the form, so it has to work every time, not just pass a demo.
- **Personal data comes with obligations.** Collecting invoice details and dietary needs meant writing a privacy policy and terms, and thinking about who can read the data.
- **Simple is easier to keep running.** No framework and no server has meant five years with almost nothing to upgrade or patch.
