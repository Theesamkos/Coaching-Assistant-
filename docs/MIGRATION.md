# Product Requirements Document: Backend Migration to Supabase

**Document Version:** 1.0
**Date:** January 3, 2026
**Author:** Theesamkos

---

## 1. Introduction

### 1.1. Overview

This document outlines the product and technical requirements for migrating the **Coaching Assistant** application's backend infrastructure from Google Firebase to Supabase. The Coaching Assistant is a React and TypeScript application designed for managing hockey coaching workflows. Currently, it relies on Firebase for authentication and database services. This migration will involve replacing Firebase Authentication with Supabase Auth and replacing the Firestore database with Supabase's PostgreSQL database.

### 1.2. Purpose and Rationale

The primary goal of this migration is to transition the application to an open-source, SQL-based backend. This strategic shift offers several key advantages:

*   **Relational Data Model**: Leverage the power and flexibility of a PostgreSQL database, enabling more complex queries and data relationships as the application scales.
*   **Reduced Vendor Lock-In**: Move to an open-source platform, providing greater control and flexibility for future development and deployment.
*   **Developer Experience**: Utilize Supabase's auto-generated APIs, robust authentication, and integrated tooling to streamline backend development.
*   **Future-Proofing**: Establish a scalable foundation that can better support planned features like the invitation system, team management, and drill assignments.

Since the application is in its early MVP stage with no existing user data, now is the ideal time to perform this migration with minimal disruption.

## 2. Goals and Objectives

The high-level objectives for this project are:

*   **Full Backend Replacement**: Successfully replace all Firebase services (Auth, Firestore) with their Supabase equivalents.
*   **Functional Parity**: Ensure all existing application features continue to function as expected with the new Supabase backend.
*   **Maintain Application Integrity**: The migration should not introduce breaking changes to the user interface or the existing frontend architecture.
*   **Establish a Scalable Foundation**: Implement a relational database schema in Supabase that aligns with the application's data models and future needs.

## 3. Scope

### 3.1. In-Scope Features

The following features and components are included in this migration:

*   **Authentication Service Migration**:
    *   Replace Firebase Email/Password authentication with Supabase Auth.
    *   Replace Firebase Google OAuth with Supabase's Google provider.
    *   Implement Supabase-equivalent logic for user registration, login, logout, and session management.
    *   Migrate the password reset functionality.
*   **Database Service Migration**:
    *   Replace the Firestore `users` collection with a `profiles` table in Supabase's PostgreSQL database.
    *   Rewrite all database service methods (`createUserProfile`, `getUserProfile`, `updateUserProfile`) to use the Supabase client.
*   **Configuration and Setup**:
    *   Define and implement a new database schema in Supabase.
    *   Configure Row Level Security (RLS) policies for data access.
    *   Update all environment variables and configuration files to use Supabase credentials.
*   **State Management and Context**:
    *   Update the `AuthContext` to use Supabase's `onAuthStateChange` listener.
    *   Adjust the Zustand `authStore` to handle the Supabase user session.

### 3.2. Out-of-Scope Features

The following items are explicitly excluded from this project:

*   **Data Migration**: As there is no production user data in Firebase, no data migration is required.
*   **New Feature Development**: This project is strictly a backend migration. No new user-facing features will be developed.
*   **UI/UX Changes**: The user interface and overall user experience will remain unchanged.
*   **Firebase Storage Migration**: The application has Firebase Storage configured but does not yet implement any file upload/download features. The setup of a storage solution will be deferred.

## 4. Functional and Technical Requirements

### 4.1. User Stories

The migration must ensure that the following user stories are fully supported by the new Supabase backend:

| ID | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| **AUTH-01** | As a new user, I want to register for an account using my email and password so that I can access the application. | A new user is created in `auth.users` and a corresponding profile is created in `public.profiles`. |
| **AUTH-02** | As a new user, I want to sign up using my Google account for a faster registration process. | A new user is created via Google OAuth, and a profile is created with their Google account information. |
| **AUTH-03** | As a registered user, I want to log in with my email and password to access my account. | The user is successfully authenticated, and their session is established. |
| **AUTH-04** | As a logged-in user, I want my session to be remembered so I don't have to log in every time I open the app. | The user's session is persisted across browser refreshes and new visits. |
| **AUTH-05** | As a user who forgot my password, I want to receive a password reset email so I can regain access to my account. | The user receives an email with a link to set a new password. |
| **AUTH-06** | As a logged-out user, I want to be redirected from protected pages to the login page. | Routes requiring authentication are inaccessible to unauthenticated users. |
| **USER-01** | As a new user, I want to complete my profile (e.g., set my role as 'coach' or 'player') after registration. | The user's information is successfully saved to their record in the `profiles` table. |
| **USER-02** | As a logged-in user, I want to view and update my profile information. | The user can fetch their current profile data and successfully submit updates. |

### 4.2. Technical Requirements

*   **Database Schema**: A `profiles` table must be created in the `public` schema in PostgreSQL. This table will be linked to the `auth.users` table via a foreign key relationship on the user's `id`.
    *   The table must include columns for `id`, `email`, `display_name`, `photo_url`, `role`, and role-specific fields like `organization` and `position`.
    *   Timestamps for `created_at` and `updated_at` must be included.
*   **Security**: Row Level Security (RLS) must be enabled on the `profiles` table. Policies must be implemented to ensure that users can only access and modify their own data.
*   **Dependencies**: The `firebase` npm package must be completely removed and replaced with `@supabase/supabase-js`.
*   **Environment**: The application must be configured to use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
*   **Services**: The `auth.service.ts` and `user.service.ts` files must be rewritten to use the `supabase` client for all backend operations.

## 5. Success Metrics

The success of this migration will be measured by the following criteria:

*   **100% Feature Parity**: All user stories listed in section 4.1 are fully functional and have been verified through manual testing.
*   **Zero Firebase Dependencies**: A search of the codebase reveals no remaining imports, configurations, or SDK calls related to Firebase.
*   **Successful Test Suite**: All existing or newly created automated tests for authentication and user profile management pass successfully.
*   **Application Stability**: The application demonstrates stable performance with no new bugs or regressions introduced by the migration.

## 6. Assumptions and Constraints

*   **Assumption**: The current feature set implemented with Firebase is the complete and final scope for this migration.
*   **Assumption**: The Supabase free tier is sufficient for the current development and testing needs.
*   **Constraint**: The migration must be completed without altering the existing frontend UI components or user flows.

---
