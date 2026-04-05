"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame,
  useInView,
} from "framer-motion";
import {
  CheckCircle2,
  BarChart3,
  Bell,
  Calendar,
  ListChecks,
  ShieldCheck,
  Link2,
  Trophy,
  Flame,
  ArrowRight,
  Star,
  Filter,
} from "lucide-react";

// ── Animated grid background ─────────────────────────────────────────

function GridPattern({
  offsetX,
  offsetY,
  id,
}: {
  offsetX: any;
  offsetY: any;
  id: string;
}) {
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id={id}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function HeroBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  useAnimationFrame(() => {
    gridOffsetX.set((gridOffsetX.get() + 0.4) % 40);
    gridOffsetY.set((gridOffsetY.get() + 0.4) % 40);
  });

  const maskImage = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 z-0 opacity-[0.04]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} id="grid-bg" />
      </div>
      <motion.div
        className="absolute inset-0 z-0 opacity-30"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern
          offsetX={gridOffsetX}
          offsetY={gridOffsetY}
          id="grid-active"
        />
      </motion.div>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute right-[-15%] top-[-15%] w-[35%] h-[35%] rounded-full bg-orange-500/30 blur-[120px]" />
        <div className="absolute right-[15%] top-[-5%] w-[15%] h-[15%] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute left-[-10%] bottom-[-15%] w-[35%] h-[35%] rounded-full bg-blue-500/30 blur-[120px]" />
      </div>
    </div>
  );
}

// ── Animated section wrapper ─────────────────────────────────────────

function FadeInSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Feature card ─────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <FadeInSection delay={delay}>
      <div className="group p-6 rounded-xl border border-border bg-white hover:shadow-lg transition-all duration-300">
        <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </FadeInSection>
  );
}

// ── Stat card ────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  delay,
}: {
  value: string;
  label: string;
  delay: number;
}) {
  return (
    <FadeInSection delay={delay}>
      <div className="text-center">
        <p className="text-4xl md:text-5xl font-extrabold text-foreground">
          {value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </FadeInSection>
  );
}

// ── Main landing page ────────────────────────────────────────────────

const FEATURES = [
  {
    icon: CheckCircle2,
    title: "Task Management",
    description:
      "Create, update, and organize tasks with priorities, statuses, and descriptions. Full CRUD with a clean, minimal interface.",
  },
  {
    icon: Trophy,
    title: "XP Gamification",
    description:
      "Earn XP for completing tasks. High priority tasks award more points. A feedback loop that makes productivity rewarding.",
  },
  {
    icon: Flame,
    title: "Daily Streaks",
    description:
      "Complete tasks on consecutive days to build streaks. Each streak day adds bonus XP. Miss a day and the streak resets.",
  },
  {
    icon: BarChart3,
    title: "Visual Dashboard",
    description:
      "Donut charts, bar charts, and radial progress rings. See your task breakdown by status and priority at a glance.",
  },
  {
    icon: Bell,
    title: "Discord and Telegram Alerts",
    description:
      "Get notified on task creation, completion, and XP earned. Connect via webhook or bot token in seconds.",
  },
  {
    icon: Calendar,
    title: "Due Dates and Reminders",
    description:
      "Set due dates on tasks. Overdue items get flagged automatically. Hourly reminder notifications for upcoming deadlines.",
  },
  {
    icon: Filter,
    title: "URL-Synced Filters",
    description:
      "Filter by status, priority, and search. Filters sync to the URL so you can bookmark views and use browser back/forward.",
  },
  {
    icon: ListChecks,
    title: "Bulk Actions",
    description:
      "Mark all tasks complete in one click. A single atomic operation that awards XP for every task in the batch.",
  },
  {
    icon: ShieldCheck,
    title: "Input Validation",
    description:
      "Title validation on both frontend and backend. Live character counter, instant error feedback, and consistent limits.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center">
        <HeroBackground />

        {/* Nav */}
        <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 py-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">
              TaskManager
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
            >
              Open App
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
          <FadeInSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-white/80 backdrop-blur-sm text-sm text-muted-foreground mb-8">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Gamified task management with XP and streaks</span>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
              Ship faster.
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent">
                Stay focused.
              </span>
            </h1>
          </FadeInSection>

          <FadeInSection delay={0.2}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              A task manager that rewards you for getting things done. Earn XP,
              build streaks, and get notified on Discord or Telegram. Simple,
              fast, and built for developers.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all active:scale-[0.98]"
              >
                View Dashboard
              </Link>
            </div>
          </FadeInSection>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 z-10">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
          </motion.div>
        </div>
      </section>

      {/* ── Stats Section ────────────────────────────────────────── */}
      <section className="py-20 border-t border-border bg-secondary/30">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value="9" label="Core Features" delay={0} />
          <StatCard value="4" label="Priority Levels" delay={0.1} />
          <StatCard value="2" label="Integrations" delay={0.2} />
          <StatCard value="50" label="Max XP per Task" delay={0.3} />
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
                Everything you need to stay on track
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built with a FastAPI backend and Next.js frontend. Every feature
                is designed to help you ship, not to get in your way.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={i * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works Section ──────────────────────────────────── */}
      <section className="py-24 px-6 bg-secondary/30 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
                How the XP system works
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Complete tasks to earn experience points. Higher priority means
                bigger rewards.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                priority: "Low",
                xp: "5 XP",
                color: "bg-emerald-500",
                textColor: "text-emerald-700",
                bgColor: "bg-emerald-50",
              },
              {
                priority: "Medium",
                xp: "15 XP",
                color: "bg-blue-500",
                textColor: "text-blue-700",
                bgColor: "bg-blue-50",
              },
              {
                priority: "High",
                xp: "30 XP",
                color: "bg-orange-500",
                textColor: "text-orange-700",
                bgColor: "bg-orange-50",
              },
              {
                priority: "Urgent",
                xp: "50 XP",
                color: "bg-red-500",
                textColor: "text-red-700",
                bgColor: "bg-red-50",
              },
            ].map((item, i) => (
              <FadeInSection key={item.priority} delay={i * 0.1}>
                <div
                  className={cn(
                    "p-6 rounded-xl border border-border text-center",
                    item.bgColor
                  )}
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full mx-auto mb-3",
                      item.color
                    )}
                  />
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {item.priority} Priority
                  </p>
                  <p
                    className={cn(
                      "text-3xl font-extrabold",
                      item.textColor
                    )}
                  >
                    {item.xp}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>

          <FadeInSection delay={0.4}>
            <div className="mt-10 p-6 rounded-xl border border-border bg-white text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-foreground">
                  Streak Bonus
                </span>
              </div>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Complete tasks on consecutive days to build a streak. Each
                streak day adds +10 XP per streak level. A 5-day streak adds
                +50 bonus XP on top of the base reward.
              </p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── Integrations Section ──────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
                Notifications where you already are
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Connect your Discord server or Telegram chat. Get alerts for
                task creation, completion, and upcoming deadlines.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeInSection delay={0.1}>
              <div className="p-8 rounded-xl border border-border bg-white">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <Link2 className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Discord
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Paste a webhook URL from your Discord server settings. Task
                  creation alerts, completion XP notifications, and daily due
                  date reminders land right in your channel.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Server Settings &rarr; Integrations &rarr; Webhooks &rarr; New Webhook
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.2}>
              <div className="p-8 rounded-xl border border-border bg-white">
                <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Telegram
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Create a bot via @BotFather, paste the token and chat ID. Get
                  the same alerts in your Telegram DMs or group chat. Reminders
                  for overdue and upcoming tasks run every hour.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  @BotFather &rarr; /newbot &rarr; Copy token
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-border bg-secondary/30">
        <div className="max-w-3xl mx-auto text-center">
          <FadeInSection>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
              Ready to start shipping?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Open the app, create your first task, and earn your first XP.
              No signup required.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-lg active:scale-[0.98]"
            >
              Open Task Manager
              <ArrowRight className="w-5 h-5" />
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>TaskManager</span>
          </div>
          <p>
            Built with Next.js, FastAPI, and Tailwind CSS.
          </p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              App
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/notifications"
              className="hover:text-foreground transition-colors"
            >
              Alerts
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
