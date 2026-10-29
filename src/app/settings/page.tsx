"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Check,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"account" | "notifications" | "security">("account");

  // Profile / Account state
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  // Notification toggles state
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [campaignUpdates, setCampaignUpdates] = useState(false);

  // Security state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMessage, setPassMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      if (profile) {
        setFullName(profile.full_name || profile.name || "");
      }

      setLoading(false);
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [supabase, router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassMessage("Passwords do not match.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      setPassMessage(error.message);
    } else {
      setPassMessage("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      alert("Error updating profile settings: " + error.message);
    } else {
      alert("Settings saved successfully.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-16">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Link>
          <h1 className="text-base font-bold text-neutral-900">Settings</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 pt-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* NAVIGATION TABS */}
          <nav className="flex flex-row gap-1 md:flex-col">
            <button
              onClick={() => setActiveTab("account")}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "account"
                  ? "bg-violet-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <User className="h-4 w-4" /> Account
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "notifications"
                  ? "bg-violet-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Bell className="h-4 w-4" /> Notifications
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "security"
                  ? "bg-violet-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Shield className="h-4 w-4" /> Security
            </button>
          </nav>

          {/* TAB CONTENT */}
          <div className="md:col-span-3">
            {activeTab === "account" && (
              <form onSubmit={handleSaveProfile} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Account Preferences</h2>
                  <p className="text-xs text-neutral-500">Manage your basic account identity details.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Email Address</label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2.5 text-sm text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Display Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Account Details"}
                </button>
              </form>
            )}

            {activeTab === "notifications" && (
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Notification Preferences</h2>
                  <p className="text-xs text-neutral-500">Configure how and when Attend sends updates.</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">Email Notifications</p>
                      <p className="text-xs text-neutral-500">Receive announcements and system alerts.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailNotifs}
                      onChange={(e) => setEmailNotifs(e.target.checked)}
                      className="h-5 w-5 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
                    />
                  </label>

                  <hr className="border-neutral-100" />

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">Event Reminders</p>
                      <p className="text-xs text-neutral-500">Get notified about upcoming saved or registered events.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={eventReminders}
                      onChange={(e) => setEventReminders(e.target.checked)}
                      className="h-5 w-5 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
                    />
                  </label>

                  <hr className="border-neutral-100" />

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">Campaign Activities</p>
                      <p className="text-xs text-neutral-500">Alerts when attendees generate graphics for your campaigns.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={campaignUpdates}
                      onChange={(e) => setCampaignUpdates(e.target.checked)}
                      className="h-5 w-5 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <form onSubmit={handleUpdatePassword} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Password & Security</h2>
                  <p className="text-xs text-neutral-500">Update your password to keep your account safe.</p>
                </div>

                {passMessage && (
                  <div className="rounded-xl bg-violet-50 p-3 text-xs font-semibold text-violet-800">
                    {passMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">New Password</label>
                  <div className="relative mt-1.5">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-neutral-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Confirm New Password</label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-neutral-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving || !newPassword}
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}