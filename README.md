# Hindustan Directory — Customer

Expo 57 customer app for browsing businesses, favourites, enquiries, and bookings.

Vendor panel lives in the sibling folder `../Hindustan`.

## Setup

```bash
npm install
cp .env.example .env   # live API by default; override for local backend
npm start
```

## Panel auth

Login always sends `role: "customer"`.
