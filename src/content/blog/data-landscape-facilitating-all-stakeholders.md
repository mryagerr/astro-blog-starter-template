---
title: 'The Data Landscape Has Expanded — And So Has Its Audience'
description: 'Smart, connected products have transformed data from an internal operational asset into a multi-stakeholder resource. The infrastructure that serves one team no longer serves the whole picture.'
pubDate: 'Mar 28 2026'
difficulty: 'low'
---

For most of computing history, data was a byproduct. Transactions happened, records were written, reports were generated. The people who cared about that data were inside the organization: finance, operations, sales. The architecture reflected that — data flowed into a warehouse, analysts queried it, dashboards were built. The stakeholder model was simple because the data model was simple.

That model stopped working around the time products grew a network connection.

## The Shift Porter and Heppelmann Identified

In 2014, Michael Porter and James Heppelmann published a piece in the *Harvard Business Review* — ["How Smart, Connected Products Are Transforming Competition"](https://www.cs.tufts.edu/comp/50IOT/Handouts/Module1Intro/1.%20HBR_How-Smart-Connected-Products-Are-Transforming-Competition.pdf) — that is still the clearest framework for understanding what happened to the data landscape.

Their central claim was structural: a new category of product had emerged that combined physical components with smart components (sensors, processors, embedded software) and connectivity components (radios, ports, protocols). The result wasn't just a better version of the old product. It was a fundamentally different kind of thing — one that generates a continuous stream of operational data, communicates with external systems, and can be updated, monitored, and optimized remotely.

The canonical example in their framework was industrial equipment: a John Deere tractor with soil sensors, GPS, yield monitors, and a cellular connection back to a product cloud. But the same structure applies to a thermostat, a car, a hospital infusion pump, or a commercial HVAC system.

What mattered for data was this: the product cloud sits at the center. Every smart connected product streams its state into it. That cloud isn't just an archive — it's the computational layer where monitoring, control, optimization, and eventually autonomy happen. And the data feeding it has immediate value to parties the original product designer never had to think about.

## Who Actually Needs the Data

The traditional warehouse model assumed one category of consumer: the internal analyst. The data was about internal operations, so the consumers were internal. That assumption breaks completely with smart connected products.

Consider what the data from a connected industrial pump is simultaneously useful for:

**The manufacturer** needs it for product improvement. Which failure modes are most common? Which configurations correlate with longer service life? Are customers using features the R&D team thought would be popular? This is feedback the pre-IoT manufacturer had to wait for — it came through service calls and warranty claims, months after the fact. Now it's continuous.

**The customer** needs it for operations. Is the equipment running within normal parameters? Is a failure developing? What's the utilization rate, and is the asset being deployed efficiently? The value proposition the manufacturer can offer has shifted from "here is a durable pump" to "here is visibility into what your pump is doing."

**The service technician** needs it for maintenance. Predictive maintenance only works if the technician can access the equipment's state before a dispatch. Routing the right technician with the right parts to the right location, before a failure occurs, requires that the service workflow has access to the same operational data the manufacturer is collecting.

**The supply chain** needs it for inventory and demand planning. If product telemetry indicates when consumables are running low or when components are approaching end-of-life, the supply chain can position inventory accordingly rather than waiting for a purchase order.

**Regulators and auditors** may need it for compliance. In industries like healthcare, energy, or food safety, equipment operational logs are evidence. They need to be accurate, tamper-evident, and accessible on demand to parties the manufacturer doesn't control.

**Third-party software vendors** need it to build integrations. As Porter and Heppelmann noted, smart connected products enable entirely new ecosystems — if you're building fleet management software, maintenance scheduling tools, or energy optimization platforms, you need access to the underlying product data to make your product work.

This isn't a list of people who would find the data vaguely interesting. Each of these stakeholders has operational workflows that break if they don't get the data they need, in the form they need it, when they need it.

## What the Old Architecture Can't Handle

The traditional data warehouse was designed to answer questions after the fact. Data lands, transforms, and becomes available for reporting. Latency is acceptable because the questions are backward-looking. Access is managed by giving analysts SQL access to tables.

That architecture fails the multi-stakeholder model in several ways.

**Latency.** A service technician dispatching to a remote site can't wait for the next ETL run. The customer seeing an equipment anomaly at 11pm needs current state, not yesterday's average. The data consumers closest to operational decisions need fresh data — often live data — not warehouse snapshots.

**Access control.** In a single-stakeholder model, you manage access with database roles. In a multi-stakeholder model, the customer should see their equipment and nobody else's. The service partner can see the equipment on their assigned accounts. The regulator can see specific operational logs but not commercial data. The third-party developer has API access to an event stream but not raw schema access. That's not a permissions problem — it's a data product architecture problem.

**Schema and semantics.** Your internal analysts understand your data model. They know what `device_state_code = 7` means. External stakeholders don't, and they shouldn't have to. If your customer needs to see whether their equipment is healthy, they need a data interface designed for that question — not a SQL credential to a table full of device codes.

**Ownership and contractual clarity.** Who owns the data that a customer's product generates? This question didn't exist when all data was internal. Now it's a legal and commercial question. The manufacturer may own the aggregate insights. The customer may own the raw operational data. A service partner may have licensed access to specific signals for specific purposes. The architecture has to enforce this, not just the contract.

## The Practical Implication

If you're building or maintaining data infrastructure for a product company — especially one with connected devices — you're not building a data warehouse. You're building a data platform with multiple tenants, multiple latency requirements, and multiple access models.

That means a few things in practice:

**The event stream is the source of truth, not the database.** Smart connected products emit events. A time-series event log is the right primary representation of that data. Everything else — dashboards, analytical models, compliance archives, customer-facing APIs — is derived from the event stream. Build around the stream.

**Design data products for each stakeholder class, not a unified schema.** Your field service portal, your customer dashboard, your internal analytics platform, and your regulatory export should each be designed for their specific consumer. They'll derive from the same underlying data, but the interface, latency, and access control model will be different.

**Data governance can't be an afterthought.** In the single-stakeholder model, governance was mostly about access control for analysts. In the multi-stakeholder model, you need explicit answers to: who owns what data, who can access it under what conditions, how long is it retained, and what happens when a customer relationship ends. These decisions need to be made before the architecture is built, because the architecture has to enforce them.

**Operational data and analytical data have different requirements.** Don't route everything through the same pipeline. Real-time operational data (equipment state, active alerts) needs a path that doesn't go through a batch ETL job. Analytical data (trend analysis, aggregate usage patterns) can tolerate more latency. Separating these paths keeps each working reliably without one blocking the other.

## The Stakeholder Lens Is Not Optional

The Porter and Heppelmann framework is often read as a competitive strategy piece — and it is — but its implication for data architecture is just as significant. The product cloud they describe isn't a single tenant system. It has to serve the manufacturer's R&D team, the customer's operations center, the service network, the supply chain, and any third-party ecosystem that builds on top of it.

Data teams that are still building for one internal consumer are building for a model that has already changed. The products being made today generate data that is valuable to parties your current architecture wasn't designed to serve.

That's not a reason to rebuild everything immediately. It's a reason to stop treating multi-stakeholder access as a future requirement and start treating it as the current design constraint.

---

- **[The Golden Age of API Access Is Over](/article/the-golden-age-of-api-access-is-over)** — The context for why external data access is now more structured and contested.
- **[Building Your First Data Pipeline](/article/building-your-first-data-pipeline)** — Foundation before adding multi-stakeholder complexity.
- **[Change Data Capture Requires an ROI to Be Taken Seriously](/article/cdc-requires-roi-to-be-taken-seriously)** — When real-time event data is worth the operational cost.
