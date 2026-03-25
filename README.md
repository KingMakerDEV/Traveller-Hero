# Traveller-Hero

> TravellerHero is a full-stack AI-powered travel planning platform that replaces the overwhelming process of trip planning with a conversational experience driven by psychological intent. Instead of asking users where they want to go, TravellerHero asks how they want to feel — and builds the entire trip around that answer.
The platform features a multi-agent AI backend built with LangGraph and powered by Meta Llama 3.3 70B via Nvidia NIM. When a user selects a travel intent such as Digital Detox, Adrenaline, or Romantic Escape, a conversational AI agent asks up to five targeted follow-up questions covering environment preferences, budget, group composition, accommodation style, and social interaction level. Once enough context is gathered, a second agent uses real-time Tavily web search to research actual destinations, hotels, restaurants, and activities before generating a complete day-by-day itinerary grounded in current data. A third agent generates precise Unsplash image keywords matched to the specific destination and each day's location, ensuring every image on the platform is contextually accurate and never repeated.
Users can confirm their generated trip to save it to their profile, edit any plan using natural language instructions which are processed by a dedicated editing agent, or book existing curated trips from the popular trips showcase. The platform supports Google OAuth authentication via Supabase, persistent trip storage in PostgreSQL, a review system, and a profile page showing all saved and booked trips.
The frontend is built with React, Vite, TypeScript, Tailwind CSS, Framer Motion, and shadcn/ui. It features a scroll-driven silhouette animation on the homepage, a real-time chat planning interface, dynamic hero carousels, and a fully responsive dark-themed design system in deep teal and gold.
Tech Stack:

Frontend: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui, Zustand
Backend: Python, Flask, LangGraph, LangChain
AI Models: Meta Llama 3.3 70B Instruct via Nvidia NIM
Real-time Search: Tavily API
Database and Auth: Supabase (PostgreSQL + Google OAuth)
Image API: Unsplash
Email: Brevo HTTP API
Deployment: Vercel (frontend) + Render (backend)

Key Features:

Conversational AI trip planning driven by psychological travel intent
Real-time destination research using Tavily web search before plan generation
Natural language trip editing powered by a dedicated LLM agent
AI-generated contextually accurate image keywords per trip and per day
Google OAuth authentication with persistent user profiles
Popular trips showcase seeded with curated Indian destinations
Trip saving, booking, deletion, and review submission
Full INR pricing with automatic USD to INR conversion
Feedback form using Brevo HTTP API with background email delivery
Scroll-driven homepage animation telling a visual story of transformation from corporate worker to world traveller

![License](https://img.shields.io/badge/license-MIT-green) ![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Language](https://img.shields.io/badge/language-TypeScript%2C%20Python%2C%20HTML%2C%20CSS%2C%20JavaScript-yellow)
![Framework](https://img.shields.io/badge/framework-Flask-orange)

## 📋 Table of Contents

- [Features](#features)
- [Usage](#usage)
- [Tech Stack](#tech-stack)

## ℹ️ Project Information

- **👤 Author:** KingMakerDEV
- **📦 Version:** 1.0.0
- **📄 License:** MIT
- **🌐 Website:** [](under ongoing work)
- **📂 Repository:** [https://github.com/KingMakerDEV/Traveller-Hero](https://github.com/KingMakerDEV/Traveller-Hero)
- **🏷️ Keywords:** AI travel planner, multi-agent AI, LangGraph, conversational AI, trip planning, psychological intent, React, Flask, Python, Nvidia NIM, Llama 3.3, Tavily search, Supabase, PostgreSQL, Google OAuth, Vercel, Render, Framer Motion, TypeScript, Vite, Tailwind CSS, Zustand, Unsplash API, Brevo email, real-time web search, natural language editing, itinerary generator, travel recommendation, full-stack web app, REST API, JWT authentication, dark theme UI, responsive design, shadcn/ui, LangChain, agentic AI, trip booking, user reviews, Indian travel, INR pricing

## Features

Features
TravellerHero offers psychological intent-based trip planning where users select how they want to feel rather than where they want to go. A conversational AI asks up to five targeted questions covering environment, budget, group size, accommodation style, and social preferences before generating a complete trip plan. All plans are grounded in real-time web research via Tavily so destinations, hotels, restaurants, and activities are current and verified rather than hallucinated from training data.
Users can edit any generated plan using plain English instructions like "make it 5 days and focus on luxury" and the AI surgically modifies only what was asked. Confirmed trips are saved to a personal profile. Existing curated trips can be booked directly from the homepage. A review system allows anyone to submit feedback without an account.
Every image across the platform is fetched from Unsplash using AI-generated keywords matched to the specific destination and each day's individual location, ensuring no image repeats and every photo is contextually accurate. All pricing is displayed in Indian Rupees.
Authentication is handled entirely through Google OAuth via Supabase — no passwords required. A feedback form on the About page delivers messages directly to the owner's inbox via the Brevo HTTP API.

## Usage

Usage
Planning a trip: Open the homepage and click Start Planning. Select a travel intent group such as Restoration and Wellness, then choose a specific intent such as Digital Detox. Answer up to five conversational questions about your preferences. The AI researches real destinations in real time and generates a complete day-by-day itinerary with accommodation, food, activities, and an estimated budget in INR.
Confirming and saving: On the trip result page click Confirm and Commit. If you are not signed in, Google login is triggered automatically. Once confirmed the trip is saved to your profile and accessible at a permanent URL.
Editing a plan: On either the trip result page or a saved trip detail page, type a natural language edit request such as "add a beach day on day 4" or "change accommodation to budget hostels" and click Refine Strategy. The AI modifies only what you asked and updates the plan in place.
Booking a curated trip: On the homepage browse the Most Popular Trip Plans section. Click any card to view the full itinerary. Click Book This Trip to add it to your profile. The system prevents duplicate bookings automatically.
Leaving a review: On any trip detail page scroll to the Field Reports section and click Transmit Your Experience. Enter your name, select a star rating, and write your review. No account required.
My profile: Click your avatar in the navbar to access your profile page showing all saved and booked trips with options to view details, re-edit, or delete each one.

## Tech Stack

Tech Stack:

Frontend: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui, Zustand
Backend: Python, Flask, LangGraph, LangChain
AI Models: Meta Llama 3.3 70B Instruct via Nvidia NIM
Real-time Search: Tavily API
Database and Auth: Supabase (PostgreSQL + Google OAuth)
Image API: Unsplash
Email: Brevo HTTP API
Deployment: Vercel (frontend) + Render (backend)

