/**
 * Help Desk Widget
 *
 * Floating help button with quick access to support options,
 * feedback submission, and help resources.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  X,
  MessageCircle,
  Bug,
  FileText,
  Send,
  ExternalLink,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type FeedbackType = "bug" | "feature" | "question" | "general";
type HelpView = "menu" | "feedback" | "success";

const feedbackTypes: { value: FeedbackType; label: string; icon: typeof Bug }[] = [
  { value: "bug", label: "Report a Bug", icon: Bug },
  { value: "feature", label: "Feature Request", icon: FileText },
  { value: "question", label: "Question", icon: HelpCircle },
  { value: "general", label: "General Feedback", icon: MessageCircle },
];

const helpLinks = [
  {
    label: "Help Center",
    href: "/explainers",
    icon: FileText,
    description: "Browse FAQs and guides",
  },
  {
    label: "Contact Support",
    href: "mailto:support@abfi.com.au",
    icon: MessageCircle,
    description: "Email our support team",
    external: true,
  },
  {
    label: "What's New",
    href: "/changelog",
    icon: FileText,
    description: "View recent updates",
  },
];

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<HelpView>("menu");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const submitFeedback = trpc.feedback.submit.useMutation();

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Reset form after animation
    setTimeout(() => {
      setView("menu");
      setSubject("");
      setMessage("");
    }, 300);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await submitFeedback.mutateAsync({
        type: feedbackType,
        subject: subject.trim() || undefined,
        message: message.trim(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      });
      setView("success");
    } catch (error) {
      console.error("[HelpWidget] Failed to submit feedback:", error);
      // Show error in UI - the mutation error will handle this
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackType, subject, message, submitFeedback]);

  const handleBackToMenu = useCallback(() => {
    setView("menu");
    setSubject("");
    setMessage("");
  }, []);

  return (
    <>
      {/* Floating Help Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open help menu"
        style={{ display: isOpen ? "none" : "flex" }}
      >
        <HelpCircle className="h-6 w-6" />
      </motion.button>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-background rounded-xl shadow-xl border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/50">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">
                  {view === "menu" && "How can we help?"}
                  {view === "feedback" && "Send Feedback"}
                  {view === "success" && "Thank You!"}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
                aria-label="Close help menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4">
              <AnimatePresence mode="wait">
                {/* Menu View */}
                {view === "menu" && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Quick Links */}
                    <div className="space-y-2">
                      {helpLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noopener noreferrer" : undefined}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                          onClick={link.external ? undefined : handleClose}
                        >
                          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <link.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-1">
                              {link.label}
                              {link.external && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {link.description}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          or
                        </span>
                      </div>
                    </div>

                    {/* Submit Feedback Button */}
                    <Button
                      className="w-full"
                      onClick={() => setView("feedback")}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Feedback
                    </Button>

                    {/* User Info */}
                    {user && (
                      <p className="text-xs text-center text-muted-foreground">
                        Logged in as {user.email}
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Feedback Form View */}
                {view === "feedback" && (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Feedback Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Feedback Type
                      </label>
                      <Select
                        value={feedbackType}
                        onValueChange={(v) => setFeedbackType(v as FeedbackType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {feedbackTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Subject{" "}
                        <span className="text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary..."
                        maxLength={100}
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us more..."
                        rows={4}
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {message.length}/2000
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleBackToMenu}
                        disabled={isSubmitting}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleSubmit}
                        disabled={!message.trim() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Feedback
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Success View */}
                {view === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6 space-y-4"
                  >
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Feedback Received!</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Thank you for helping us improve the platform.
                      </p>
                    </div>
                    <Button onClick={handleClose} className="w-full">
                      Close
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default HelpWidget;
