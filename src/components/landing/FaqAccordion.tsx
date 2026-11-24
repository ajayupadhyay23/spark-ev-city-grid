"use client";

/**
 * @file src/components/landing/FaqAccordion.tsx
 * @description Two-column animated FAQ accordion section with accessible keyboard navigation.
 * @purpose Answers critical driver questions regarding dynamic surge pricing, refunds, and charger compatibility.
 * Accordion items use Framer Motion height + fade animation with + to x 45deg rotation on open.
 * @connections
 * - Used in /src/app/page.tsx
 * - Pulls questions from FAQ_ITEMS in /src/lib/constants.ts
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/constants";

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section id="faq" className="py-20 px-4 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Left Column: Big Heading */}
        <div className="md:col-span-4 space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-rust font-bold">
            Frequently Asked
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-sans text-white tracking-tight">
            What drivers ask.
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
            Need clarity on how real-time reservations, dynamic surge rates, or EV connector matching
            work? Everything you need to know before you plug in.
          </p>
        </div>

        {/* Right Column: Accordion list separated by thin horizontal lines */}
        <div className="md:col-span-8 divide-y divide-white/10 border-t border-b border-white/10">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            const contentId = `faq-answer-${index}`;
            const headerId = `faq-header-${index}`;

            return (
              <div key={index} className="py-5">
                <button
                  id={headerId}
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  className="w-full flex items-center justify-between text-left group focus:outline-none focus:ring-1 focus:ring-rust rounded-lg"
                >
                  <span className="text-sm sm:text-base font-semibold text-white group-hover:text-rust transition-colors pr-6">
                    {item.question}
                  </span>

                  {/* + icon that smoothly rotates 45 degrees into an x */}
                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="p-1 rounded-full bg-white/5 text-neutral-300 group-hover:text-white shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.div>
                </button>

                {/* Animated expandable answer container */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={contentId}
                      role="region"
                      aria-labelledby={headerId}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs sm:text-sm text-neutral-400 pt-3 leading-relaxed">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
