"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchNotificationConfigs,
  saveNotificationConfig,
  deleteNotificationConfig,
  testNotification,
  type NotificationConfig,
} from "@/lib/api";

export default function NotificationsPage() {
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [service, setService] = useState<"discord" | "telegram">("discord");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");

  const loadConfigs = async () => {
    try {
      const data = await fetchNotificationConfigs();
      setConfigs(data);
    } catch (err) {
      console.error("Failed to load configs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveNotificationConfig({
        service,
        webhook_url: service === "discord" ? webhookUrl : undefined,
        bot_token: service === "telegram" ? botToken : undefined,
        chat_id: service === "telegram" ? chatId : undefined,
        enabled: true,
      });
      setWebhookUrl("");
      setBotToken("");
      setChatId("");
      await loadConfigs();
    } catch (err) {
      console.error("Failed to save config:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotificationConfig(id);
      await loadConfigs();
    } catch (err) {
      console.error("Failed to delete config:", err);
    }
  };

  const handleTest = async () => {
    setTestStatus("sending");
    try {
      await testNotification();
      setTestStatus("sent");
      setTimeout(() => setTestStatus(null), 3000);
    } catch {
      setTestStatus("failed");
      setTimeout(() => setTestStatus(null), 3000);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Notification Settings
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Get Discord or Telegram alerts when tasks are completed
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 self-start"
        >
          Back to Tasks
        </Link>
      </div>

      {/* Add new config */}
      <form
        onSubmit={handleSave}
        className="p-5 border border-gray-200 rounded-xl bg-gray-50 mb-6"
      >
        <h2 className="font-semibold text-gray-900 mb-4">
          Add Integration
        </h2>
        <div className="grid gap-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setService("discord")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border transition-all ${
                service === "discord"
                  ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Discord
            </button>
            <button
              type="button"
              onClick={() => setService("telegram")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border transition-all ${
                service === "telegram"
                  ? "bg-sky-100 border-sky-300 text-sky-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Telegram
            </button>
          </div>

          {service === "discord" ? (
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Server Settings &rarr; Integrations &rarr; Webhooks &rarr; New
                Webhook &rarr; Copy URL
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Bot Token
                </label>
                <input
                  type="text"
                  placeholder="123456:ABC-DEF..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Talk to @BotFather on Telegram to create a bot and get the
                  token
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Chat ID
                </label>
                <input
                  type="text"
                  placeholder="-1001234567890"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use @userinfobot to find your chat ID, or use a group chat ID
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Integration"}
          </button>
        </div>
      </form>

      {/* Existing configs */}
      <div className="p-5 border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Active Integrations</h2>
          {configs.length > 0 && (
            <button
              onClick={handleTest}
              disabled={testStatus === "sending"}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {testStatus === "sending"
                ? "Sending..."
                : testStatus === "sent"
                ? "Sent!"
                : testStatus === "failed"
                ? "Failed"
                : "Send Test"}
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : configs.length === 0 ? (
          <p className="text-sm text-gray-400">
            No integrations configured yet. Add one above to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {configs.map((cfg) => (
              <div
                key={cfg.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      cfg.service === "discord"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    {cfg.service}
                  </span>
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {cfg.service === "discord"
                      ? cfg.webhook_url?.slice(0, 50) + "..."
                      : `Chat: ${cfg.chat_id}`}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(cfg.id)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mt-6 p-5 border border-dashed border-gray-300 rounded-xl">
        <h3 className="font-semibold text-gray-700 mb-2">How it works</h3>
        <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
          <li>
            When you complete a task, a notification is sent with the XP earned
          </li>
          <li>Streak bonuses are included in the notification</li>
          <li>
            You can add both Discord and Telegram — notifications go to all
            active integrations
          </li>
          <li>Use the &quot;Send Test&quot; button to verify your setup</li>
        </ul>
      </div>
    </main>
  );
}
