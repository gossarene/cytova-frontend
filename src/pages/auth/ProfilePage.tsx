/**
 * Personal profile page — accessible to ALL authenticated users.
 * Re-exports the SettingsPage component which handles:
 * - Viewing own account info (email, role, permissions)
 * - Editing own display name
 * - Changing own password
 *
 * This route (/profile) has NO permission guard — any authenticated
 * user can access their own profile. This is distinct from /settings
 * which is reserved for lab-wide configuration (admin-only).
 */
export { SettingsPage as ProfilePage } from '@/modules/settings/pages/SettingsPage'
