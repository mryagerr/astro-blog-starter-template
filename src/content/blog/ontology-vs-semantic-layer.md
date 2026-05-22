---
title: 'Ontology vs Semantic Layer: What Each One Actually Is'
description: 'An ontology defines what your business means. A semantic layer enforces those definitions inside your data stack. They are not synonyms, and confusing them produces dashboards that look authoritative but disagree with each other.'
pubDate: 'May 22 2026'
heroImage: '/blog-ontology-semantic-layer.png'
difficulty: 'high'
tags: ['analysis', 'culture']
---

The words *ontology* and *semantic layer* have been moving in and out of data team vocabulary for a decade, and they have started showing up in the same sentences as if they were interchangeable. They are not. One describes what your business means by the words it uses. The other is a piece of software that sits between your warehouse and your dashboards. You can have one without the other — and most organizations do — but the cost of confusing them is a stack that looks coherent and isn't.

This article separates the two, shows where they overlap, and explains why a healthy data practice eventually needs both.

## What an Ontology Is

An **ontology** is a formal model of the concepts in a domain, the relationships between those concepts, and the rules that constrain them. It answers questions like: *What is a customer?* *What counts as an active subscription?* *Which entities can own a contract?* *When is a transaction considered closed?*

An ontology lives above any particular database. It is a definitional artifact, written in language and diagrams (sometimes in OWL or RDF, often in plain prose backed by an ER diagram). It tells you that a `Customer` is a party that has placed at least one paid order, that a `Customer` is either an `Individual` or an `Organization`, and that every `Order` belongs to exactly one `Customer`. Those statements are true regardless of how your warehouse is structured today.

A good ontology has three properties:

- **Concepts are named and defined.** "Active user" is not assumed to be self-explanatory — it has a written definition with edge cases.
- **Relationships are explicit.** You know which entities can be related and how (one-to-many, many-to-many, optional, mandatory).
- **Rules are stated.** "A subscription cannot be active and cancelled at the same time" is a rule the model enforces, not a coincidence the data happens to obey.

Ontologies belong to the business as much as to the data team. The CFO has opinions about what a customer is. The product team has opinions about what an active user is. An ontology is where those opinions get written down, reconciled, and made the source of truth.

## What a Semantic Layer Is

A **semantic layer** is a piece of software in your data stack. It sits between physical tables (in Snowflake, BigQuery, Databricks, DuckDB) and the consumers of those tables (BI tools, notebooks, AI agents, embedded analytics). Its job is to translate raw warehouse columns into business concepts on demand, so every consumer that asks for `monthly_recurring_revenue` gets the same number computed the same way.

Concretely, a semantic layer is configuration: SQL snippets, join definitions, dimension and metric declarations, often expressed in YAML or a DSL. Tools in this space include the dbt Semantic Layer / MetricFlow, Cube, AtScale, Looker (LookML), and the metrics layers shipped by warehouses themselves.

A semantic layer typically encodes:

- **Metrics** — a single, version-controlled definition of `revenue`, `active_users`, `churn_rate`, etc., expressed as aggregations over warehouse tables.
- **Dimensions** — the slicing axes (region, plan, channel, signup_cohort) that metrics can be grouped by.
- **Joins** — the canonical relationships between tables, so a consumer can ask for "revenue by region" without re-deriving the join every time.
- **Access rules** — which roles can see which dimensions or metrics.

It is, in effect, a thin layer of business meaning encoded in code that lives inside your data infrastructure.

## Where the Confusion Starts

The two concepts get conflated because a semantic layer ends up *expressing parts of* an ontology — usually the parts that are quantitative. A metric definition in MetricFlow says what `revenue` is, computationally. An ontology definition of `revenue` says what the business means by the word and under which conditions a payment counts. The semantic layer's definition is one possible implementation of the ontology's definition.

The confusion is reasonable, but it papers over three differences that matter in practice.

### 1. Scope

An ontology covers concepts that are not necessarily quantitative or even queryable. *What is a contract?* *What are the allowed states of an order?* *What does it mean for a customer to be "at risk"?* These can have implications for metrics, but the ontology itself is broader — it is the model of the domain, not the model of the dashboards.

A semantic layer scopes itself to what can be asked and answered against the warehouse. It is fundamentally a query-time abstraction.

### 2. Coupling to technology

An ontology is, by design, technology-independent. The same ontology should be valid whether your warehouse is Snowflake today and Databricks tomorrow. It does not assume the existence of a particular table or column.

A semantic layer is tightly coupled to a specific warehouse, a specific tool, and a specific physical model. Move from Snowflake to BigQuery and the semantic layer must be re-pointed, often re-implemented. The metric *concept* survives the move. Its semantic-layer implementation does not.

### 3. Authorship

An ontology is, at its best, co-authored by the business and the data team. Domain experts contribute definitions; data architects formalize them. The result is a shared vocabulary the organization can agree on.

A semantic layer is almost always authored by analytics engineers. It is a software artifact, version-controlled in a Git repository, deployed with the rest of the data stack.

---

## Side-by-Side Comparison

| Dimension | Ontology | Semantic Layer |
|---|---|---|
| What it is | A formal model of meaning | A software layer in the data stack |
| Lives in | Documents, diagrams, RDF/OWL, prose | YAML / DSL / a metrics service |
| Coupled to a warehouse | No | Yes |
| Authored by | Business + data architects | Analytics engineers |
| Scope | All concepts in the domain | Concepts you can query in the warehouse |
| Includes rules and axioms | Yes | Rarely — mostly metrics, dimensions, joins |
| Survives a warehouse migration | Yes | No |
| Output | Definitions, diagrams, constraints | Consistent metric values across consumers |
| Failure mode when missing | Tribal knowledge, conflicting definitions | Every BI tool computes the same metric differently |

---

## What Goes Wrong Without an Ontology

When a team builds a semantic layer with no underlying ontology, the semantic layer becomes a record of whatever definitions the analytics engineer encoded the day they wrote the YAML. That is usually fine for the first three metrics. By the fortieth, the metric definitions disagree with each other — `active_user` excludes trial accounts in one metric and includes them in another — and there is no upstream document anyone can point to as the source of truth. The semantic layer is internally consistent in the trivial sense that the code runs, but it has stopped being a faithful representation of the business.

The other common failure: the semantic layer encodes a definition the business never actually agreed to. Someone made a judgment call about edge cases at metric-writing time, and now that judgment is being multiplied across every dashboard. No one notices until a quarterly review surfaces a number that disagrees with what the operating team is measuring on the ground.

## What Goes Wrong Without a Semantic Layer

When a team has a beautifully maintained ontology and no semantic layer, the ontology is correct and the dashboards are wrong. Every BI tool implements the metrics independently. The Looker explore computes churn one way, the ad-hoc SQL in the analyst's notebook computes it another, and the executive deck uses a third version from a spreadsheet someone built six months ago. The ontology document is right. The numbers in the room are inconsistent. The organization gets the worst of both worlds: a clear definition of truth and no operational mechanism to enforce it.

The ontology, by itself, has no enforcement surface. It is a contract no system is obligated to honor.

## How the Two Should Fit Together

The healthy relationship is upstream/downstream. The ontology is the source. The semantic layer is one of several downstream artifacts that implement it.

```
Business reality
        ↓
   Ontology (definitions, rules, relationships)
        ↓
   Semantic layer (queryable metrics on the warehouse)
        ↓
   BI, notebooks, agents, embedded analytics
```

Practically, that means:

- Definitions are written and reviewed in the ontology *first*. A new metric request is not "add this metric to dbt"; it is "what is this concept, who owns its definition, what are its edge cases?" The semantic layer entry is the implementation of an answered question, not the question itself.
- When the business changes — a new product line, a redefined customer segment, a regulatory change — the ontology is updated first. The semantic layer is then updated to match, and the lineage between them is explicit.
- Where the ontology and the semantic layer disagree, the ontology wins. The semantic layer is treated as a possibly-stale implementation, not as the authoritative definition.

Some teams formalize this by generating semantic-layer YAML from an ontology source, so the two cannot drift apart silently. That is the ideal but rare. Most teams will run the two as separate artifacts with a documented review process that ties them together. Either approach works as long as the ordering is preserved: the ontology defines, the semantic layer implements.

## When You Need Which

You need an **ontology** — even an informal one — as soon as more than one person is producing analyses. The cost of not having a shared definition of "customer" rises faster than most teams expect, and the cost is usually paid in the form of meetings about why two dashboards disagree.

You need a **semantic layer** once you have more than a couple of BI tools or notebook environments hitting the same warehouse. The moment the same metric is being computed in two places, you have an enforcement problem that documentation alone cannot solve.

You almost never need a full formal ontology in OWL with reasoners and inference. A well-maintained glossary, an ER diagram, and a definitions document covering metrics, entities, and states will do the job for the overwhelming majority of organizations. Treat formal ontology tooling as something to reach for only when you have a regulated domain or a large enough estate that informal documents have stopped scaling.

---

## The Low Hanging Data Take

The semantic layer is the part that gets the headlines, because it is a piece of software that companies sell. The ontology is the part that determines whether the semantic layer is worth running. A semantic layer with no ontology behind it is a very efficient mechanism for distributing the wrong definition across your organization. An ontology with no semantic layer is a thoughtful document that does not show up in any dashboard your CEO sees.

Build the ontology first, even informally. Write down what your business means by its words, and who owns each definition. Then build the semantic layer as the mechanism that makes those definitions show up consistently in every tool that asks. The two are not competing — they are sequential. Skip the first step and the second step amplifies your confusion.

## Next Steps

- **[The Silent Death of Orphan Data Pipelines](/article/data-product-decay/)** — Why definitions drift away from operational reality the moment no one is actively engaged with the data product.
- **[The Telephone Game of Bad Analytics](/article/telephone-game-bad-analytics/)** — What happens when shared meaning erodes across the analytics chain.
- **[Writing for the Executive, Surviving the Analyst](/article/write-for-the-executive-survive-the-analyst/)** — Making sure the definitions in your semantic layer match the language of the people consuming the output.
