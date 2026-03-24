import { Radio, Server, Database, Monitor, Shield, Lock, Cpu } from "lucide-react";

const steps = [
  {
    icon: Radio,
    title: "Smart Sensors",
    description: "Small devices placed near water sources and pumps measure how much water is being used, groundwater levels, and water quality — automatically, 24/7.",
  },
  {
    icon: Cpu,
    title: "Data Processing",
    description: "The sensor readings are sent wirelessly to our processing system, which cleans the data, checks for errors, and organizes it so it's ready to display.",
  },
  {
    icon: Lock,
    title: "Secure & Tamper-Proof Storage",
    description: "Every data point is saved in a way that cannot be changed or deleted. Using blockchain-inspired technology, we ensure the records are permanent and trustworthy.",
  },
  {
    icon: Monitor,
    title: "Public Dashboard",
    description: "The processed data appears on this dashboard in near real-time, so anyone can see exactly what's happening — no hidden numbers, no manipulation.",
  },
];

export default function TransparencyPage() {
  return (
    <div className="container py-8 space-y-12">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">Data & Transparency</h1>
        <p className="text-muted-foreground mt-1">
          How we collect, protect, and share water data — explained simply.
        </p>
      </div>

      {/* Data flow */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-6">How Data Flows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="bg-card rounded-xl card-elevated p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step {i + 1}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 text-center text-muted-foreground/40 text-xl">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Trust pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Shield,
            title: "Trust",
            text: "Every reading is verified and cross-checked. If a sensor fails, the system flags it immediately — no silent gaps.",
          },
          {
            icon: Lock,
            title: "Transparency",
            text: "All data is publicly available. Companies, communities, and regulators see the same numbers — no special access.",
          },
          {
            icon: Database,
            title: "Data Integrity",
            text: "Records are stored with tamper-proof technology. Once data is recorded, it cannot be altered by anyone — including us.",
          },
        ].map((item, i) => (
          <div key={i} className="bg-card rounded-xl card-elevated p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-4">
              <item.icon className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
          </div>
        ))}
      </section>

      {/* FAQ style */}
      <section className="max-w-2xl space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Common Questions</h2>
        {[
          { q: "What are IoT sensors?", a: "Small electronic devices that measure things like water flow, pressure, and chemical levels. They send data wirelessly without needing human involvement." },
          { q: "What is a smart pump?", a: "A water pump connected to the internet that reports exactly how much water it moves. It can be monitored and sometimes controlled remotely." },
          { q: "How does blockchain help?", a: "Blockchain is a technology that stores records so they can never be changed after being saved. It's like writing in permanent ink — nobody can erase or alter the data." },
          { q: "Can companies cheat the system?", a: "The sensors are independently operated and regularly calibrated. Any tampering triggers an alert. The data storage is immutable — meaning it can't be modified." },
        ].map((item, i) => (
          <div key={i} className="bg-card rounded-xl card-elevated p-5">
            <h4 className="font-medium text-foreground mb-1">{item.q}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
