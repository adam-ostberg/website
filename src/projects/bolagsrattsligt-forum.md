---
title: Bolagsrättsligt Forum
date: 2021-03-09   # TODO: when you started (sorts the list)
end: 2026-01-01
summary: Designed, built and maintain the website and sign-up form for an annual two-day company law course.
stack: [HTML, CSS, JavaScript, Firebase]
featured: false
image: /assets/img/BolagsrattsligtForum.jpg
imageAlt: A screenshot of bolagsrattsligtforum.se
links:
  site: https://www.bolagsrattsligtforum.se/
---
{% note %}
Client work, built and run on my own since 2021. The site is in Swedish.
{% endnote %}

## What it is

Bolagsrättsdagarna is a two-day course in Swedish company law, held every September at a conference hotel outside Stockholm. The teachers are lawyers who specialise in the field, several of whom also teach at Stockholm University. The website is where people find information about the course and sign up for it.

The current version is a full redesign of the site. <!-- TODO: add the year, plus what changed and why (new look, new form, easier to update?). -->

## How it works

- **Static pages.** Plain HTML, CSS and JavaScript, with no framework. A site like this doesn't need one, and the client's regular web host can serve it as is.
- **Sign-up form.** It collects contact and invoice details, dietary needs and a hotel booking. Sections appear only when they apply: the allergy options show up if you need special food, and the field for a roommate's name appears only if you book a shared double room. Discount codes are supported too.
- **Storing sign-ups.** Registrations go straight from the browser to Firebase Firestore, so there's no server to run or keep patched.
- **Privacy.** The form collects personal data, so it includes a privacy policy and booking terms that people have to accept before they can sign up.

## Running it every year

Before each course I update the dates, programme, prices and hotel rates, and I manage the sign-ups in the database. <!-- TODO: say how the organisers get the sign-ups (export, email, admin view?) in place of "manage the sign-ups in the database". -->
