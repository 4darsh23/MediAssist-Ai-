"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Settings, User, Bell, Moon, Sun, Monitor, Shield, Globe, Trash2, Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    scanResults: true,
    vitalAlerts: true,
    weeklyReport: false,
    outbreakAlerts: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isLoaded || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-blue-500" />
            Profile
          </h2>

          <div className="flex items-center gap-4 mb-6">
            <img
              src={user?.imageUrl || "/default-avatar.png"}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.fullName || "User"}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.primaryEmailAddress?.emailAddress}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Member since {new Date(user?.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
              <input
                type="text"
                defaultValue={user?.firstName || ""}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
              <input
                type="text"
                defaultValue={user?.lastName || ""}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                placeholder="Last name"
              />
            </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <Moon className="w-5 h-5 text-purple-500" />
            Appearance
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "light", label: "Light", icon: Sun, desc: "Light background" },
              { id: "dark", label: "Dark", icon: Moon, desc: "Dark background" },
              { id: "system", label: "System", icon: Monitor, desc: "Follow system" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  theme === option.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
              >
                <option.icon className={`w-6 h-6 mx-auto mb-2 ${
                  theme === option.id ? "text-blue-500" : "text-gray-400 dark:text-gray-500"
                }`} />
                <p className={`text-sm font-medium ${
                  theme === option.id ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                }`}>{option.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-orange-500" />
            Notifications
          </h2>

          <div className="space-y-4">
            {[
              { key: "scanResults", label: "Scan Results", desc: "Get notified when AI scan analysis is complete" },
              { key: "vitalAlerts", label: "Vital Alerts", desc: "Receive alerts when vitals are outside normal range" },
              { key: "weeklyReport", label: "Weekly Report", desc: "Receive a weekly health summary email" },
              { key: "outbreakAlerts", label: "Outbreak Alerts", desc: "Get notified about disease outbreaks in your region" },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                  }
                  className={`w-11 h-6 rounded-full transition-colors ${
                    notifications[item.key] ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      notifications[item.key] ? "translate-x-5.5" : "translate-x-0.5"
                    }`}
                    style={{
                      transform: notifications[item.key] ? "translateX(22px)" : "translateX(2px)",
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-emerald-500" />
            Privacy & Data
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Data Storage</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your medical images are processed in-browser and not stored on our servers</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">AI Model</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">ONNX Runtime runs entirely in your browser — no data leaves your device</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-500/30 p-6">
          <h2 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition">
            Delete Account
          </button>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle className="w-4 h-4" />
              Settings saved!
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium text-sm"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
