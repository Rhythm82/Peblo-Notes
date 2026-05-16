import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  ImagePlus,
  PenLine,
  PlayCircle,
  Share2,
  Sparkles,
  Stars,
  WandSparkles,
} from "lucide-react";

import familyPencil from "../assets/img/family-pencil.gif";
import img2 from "../assets/img/img2.gif";
import introGif from "../assets/img/intro.gif";
import treeGif from "../assets/img/tree.gif";

const studyCards = [
  {
    image: introGif,
    label: "First steps",
    title: "Simple interactive learning",
    copy: "Small visual notes help children understand each idea without feeling lost.",
    tint: "bg-sky-50 border-sky-100 text-sky-800 dark:border-cyan-300/25 dark:bg-cyan-950/60 dark:text-cyan-100",
  },
  {
    image: treeGif,
    label: "Idea growth",
    title: "Build lessons slowly",
    copy: "Start with one point, then grow it into examples, pictures, and revision notes.",
    tint: "bg-emerald-50 border-emerald-100 text-emerald-800 dark:border-emerald-300/25 dark:bg-emerald-950/55 dark:text-emerald-100",
  },
  {
    image: img2,
    label: "Creative notes",
    title: "Turn rough writing into cards",
    copy: "Use color, images, and AI summaries to make study material easier to remember.",
    tint: "bg-amber-50 border-amber-100 text-amber-800 dark:border-amber-300/25 dark:bg-slate-900/80 dark:text-amber-100",
  },
];

const noteSteps = [
  { icon: PenLine, title: "Write", copy: "Capture a small thought or lesson." },
  { icon: ImagePlus, title: "Add", copy: "Place helpful pictures beside the note." },
  { icon: Brain, title: "Summarize", copy: "Make quick revision points with AI." },
  { icon: Share2, title: "Share", copy: "Send a clean page to friends or class." },
];

const features = [
  "Kid-friendly note cards",
  "AI study summaries",
  "Image-rich lessons",
  "PDF export",
  "Public sharing",
  "Subject organization",
];

function ActionLink({ to, children, primary = false }) {
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-black shadow-lg transition duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-amber-200 ${
        primary
          ? "bg-slate-950 text-white shadow-slate-950/20 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-100"
          : "border border-slate-200 bg-white/85 text-slate-900 shadow-amber-900/10 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
      }`}
    >
      {children}
    </Link>
  );
}

function PaperStroke({ width, delay }) {
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-slate-200/70">
      <motion.span
        className="block h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-400 to-amber-400"
        animate={{ width: ["0%", width, width, "0%"] }}
        transition={{
          duration: 4.2,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </span>
  );
}

function WritingPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="relative mx-auto max-w-[470px] rounded-md border border-amber-200 bg-[#fffdf5] p-5 shadow-2xl shadow-amber-900/15 dark:border-white/10 dark:bg-slate-900"
    >
      <div className="pointer-events-none absolute inset-y-0 left-10 w-px bg-rose-300/70 dark:bg-rose-300/30" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_31px,rgba(56,189,248,0.18)_32px)] bg-[size:100%_32px]" />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-rose-600 dark:text-rose-200">
              Today&apos;s note
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
              Water Cycle
            </h2>
          </div>

          <motion.div
            animate={{ rotate: [-10, 8, -10], y: [0, 4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="grid h-12 w-12 place-items-center rounded-full bg-amber-300 text-slate-950 shadow-lg shadow-amber-600/25"
            aria-hidden="true"
          >
            <PenLine size={22} />
          </motion.div>
        </div>

        <div className="mt-6 space-y-4 pl-9">
          <PaperStroke width="92%" delay={0} />
          <PaperStroke width="74%" delay={0.35} />
          <PaperStroke width="86%" delay={0.7} />
          <PaperStroke width="58%" delay={1.05} />
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3 pl-9">
          {["Read", "Draw", "Share"].map((item, index) => (
            <motion.span
              key={item}
              animate={{ y: [0, index % 2 ? -3 : 3, 0] }}
              transition={{
                duration: 3 + index,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-center text-xs font-black text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white"
            >
              {item}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function FloatingObject({ className, children, delay = 0 }) {
  return (
    <motion.span
      className={`pointer-events-none absolute hidden place-items-center rounded-full border border-slate-200 bg-white/85 text-slate-800 shadow-lg shadow-amber-900/10 backdrop-blur md:grid dark:border-white/10 dark:bg-white/10 dark:text-white ${className}`}
      animate={{ y: [0, -10, 0], rotate: [-3, 4, -3] }}
      transition={{ duration: 5, delay, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      {children}
    </motion.span>
  );
}

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fbf4df] text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,transparent_52px,rgba(244,63,94,0.26)_53px,transparent_54px),linear-gradient(to_bottom,rgba(14,165,233,0.16)_1px,transparent_1px)] bg-[size:100%_100%,100%_30px] dark:opacity-25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(251,191,36,0.28),transparent_24%),radial-gradient(circle_at_86%_18%,rgba(14,165,233,0.16),transparent_24%),linear-gradient(135deg,rgba(255,253,245,0.86),rgba(251,244,223,0.74))] dark:bg-[linear-gradient(135deg,rgba(2,6,23,0.9),rgba(15,23,42,0.92))]" />

      <FloatingObject className="left-[7%] top-28 h-12 w-12" delay={0.2}>
        <Stars size={20} />
      </FloatingObject>
      <FloatingObject className="right-[8%] top-40 h-14 w-14" delay={0.9}>
        <BookOpenCheck size={22} />
      </FloatingObject>
      <FloatingObject className="bottom-36 left-[4%] h-11 w-11" delay={1.5}>
        <Sparkles size={19} />
      </FloatingObject>

      <section className="relative px-4 pb-8 pt-8 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-xs font-black text-slate-800 shadow-sm shadow-amber-900/10 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-amber-100 sm:text-sm">
              <Sparkles size={16} />
              Clean notes for little learners
            </div>

            <h1 className="mt-5 text-5xl font-black leading-[1.02] text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
              PebloNotes
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700 dark:text-slate-200">
              A soft notebook workspace where children can write, add pictures,
              learn from short visual cards, create AI summaries, and share
              beautiful study notes.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ActionLink to="/signup" primary>
                Start learning
                <ArrowRight size={17} />
              </ActionLink>
              <ActionLink to="/login">
                <PlayCircle size={17} />
                Login
              </ActionLink>
            </div>

            <div className="mt-7 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex min-h-14 items-center gap-2 rounded-md border border-white/80 bg-white/70 px-3 py-3 text-sm font-black text-slate-700 shadow-sm shadow-amber-900/5 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                >
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="relative">
            <WritingPreview />

            <motion.div
              initial={{ opacity: 0, y: 20, rotate: 1.2 }}
              animate={{ opacity: 1, y: 0, rotate: 1.2 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mx-auto mt-6 max-w-[560px] overflow-hidden rounded-md border border-amber-200 bg-white/80 p-4 shadow-xl shadow-amber-900/10 backdrop-blur dark:border-white/10 dark:bg-white/10"
            >
              <div className="grid items-center gap-5 sm:grid-cols-[0.82fr_1.18fr]">
                <img
                  src={familyPencil}
                  alt="Animated pencil family for learning notes"
                  className="h-40 w-full object-contain sm:h-48"
                />
                <div>
                  <p className="text-xs font-black uppercase text-sky-700 dark:text-sky-200">
                    Friendly writing space
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    Write like paper, organize like a smart notebook.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    The page feels familiar, while the tools help students keep
                    every lesson tidy and easy to revise.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-black text-slate-700 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
                <WandSparkles size={16} />
                Learning cards
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                Clear visuals, short notes, and small steps for easy study.
              </h2>
            </div>

            <p className="max-w-md leading-7 text-slate-700 dark:text-slate-200">
              Each image is connected to a real learning action, so the landing
              page feels useful and simple from the first glance.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {studyCards.map((card, index) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className={`rounded-md border ${card.tint} p-5 shadow-lg shadow-amber-900/8 dark:shadow-cyan-950/20`}
              >
                <div className="flex h-44 items-center justify-center rounded-md bg-white/70 p-3 dark:bg-white/8 dark:ring-1 dark:ring-white/10">
                  <img
                    src={card.image}
                    alt={`${card.title} animation`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="mt-5 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-black dark:bg-white/10 dark:text-current dark:ring-1 dark:ring-white/10">
                  {card.label}
                </span>
                <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                  {card.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-700 dark:text-slate-200">
                  {card.copy}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {noteSteps.map(({ icon: Icon, title, copy }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="rounded-md border border-white/80 bg-white/75 p-5 shadow-lg shadow-amber-900/10 backdrop-blur dark:border-white/10 dark:bg-white/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Icon size={21} />
                  </span>
                  <span className="text-4xl font-black text-amber-300">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-slate-700 dark:text-slate-200">
                  {copy}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-md border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 dark:border-white/10 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[1fr_0.75fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-amber-200">
                Ready for a cleaner notebook?
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Start with one note, then make it visual, summarized, and easy
                to share.
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <ActionLink to="/signup" primary>
                Create account
                <ArrowRight size={17} />
              </ActionLink>
              <ActionLink to="/login">Login</ActionLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Landing;
