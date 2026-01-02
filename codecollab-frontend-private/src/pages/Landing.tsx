import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Code2, Terminal, Zap, Users, Shield, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-[6px] bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Code2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              CodeCollab
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Link to="/register">
              <Button size="sm" className="rounded-[6px] px-4 font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-foreground leading-[1.1]">
              Collaborative coding <br />
              <span className="text-muted-foreground font-medium">
                for professional teams.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Secure, real-time code editing with instant execution. Build,
              debug, and mentor in a high-performance environment designed for
              modern developers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-[6px] text-base font-semibold shadow-sm"
                >
                  Start Coding Now
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 rounded-[6px] text-base font-medium border-border hover:bg-secondary"
                >
                  Book a Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-border bg-secondary/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Zap,
                title: "Zero Latency",
                desc: "Powered by Yjs CRDTs for professional-grade synchronization across the globe.",
              },
              {
                icon: Terminal,
                title: "Isolated Runtimes",
                desc: "Execute code securely in sandboxed Docker containers with dedicated resources.",
              },
              {
                icon: Shield,
                title: "Access Control",
                desc: "Granular permissions, private rooms, and secure invite codes for your team.",
              },
            ].map((f, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="h-10 w-10 rounded-[6px] bg-primary/10 flex items-center justify-center text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="p-12 rounded-[12px] border border-border bg-card shadow-sm">
            <h2 className="text-3xl font-bold mb-6">
              Ready to scale your collaboration?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Join thousands of teams shipping code faster with CodeCollab.
            </p>
            <Link to="/register">
              <Button
                size="lg"
                className="rounded-[6px] px-10 font-semibold group"
              >
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="container mx-auto px-6 h-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">
              CodeCollab
            </span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              System Status
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Security
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; 2026 CodeCollab Inc. Built with Restraint.
          </p>
        </div>
      </footer>
    </div>
  );
}
