---
title: 'Python Virtual Environments'
description: 'Isolate project dependencies with virtual environments so your projects stay reproducible and your system Python stays clean.'
pubDate: 'May 14 2025'
heroImage: '/blog-python-venv.png'
difficulty: 'low'
tags: ['preparation']
---

Every Python project eventually pulls in third-party packages. The problem is that packages have versions, and different projects often need different versions of the same package. Virtual environments solve this by giving each project its own isolated Python installation — its own `site-packages`, its own `pip`, its own executable.

Without virtual environments, all packages install globally. Eventually two projects conflict, something breaks, and you spend an afternoon figuring out why `import pandas` stopped working.

## Creating a Virtual Environment

Python ships with `venv` in the standard library. No installation required.

```bash
# Create a virtual environment named .venv in the current directory
python3 -m venv .venv
```

`.venv` is the conventional name. It's short, it sorts to the top of directory listings, and most `.gitignore` templates already exclude it.

## Activating the Environment

Activating modifies your shell's `PATH` so that `python` and `pip` point to the environment instead of the system installation.

```bash
# macOS / Linux
source .venv/bin/activate

# Windows (Command Prompt)
.venv\Scripts\activate.bat

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

Once activated, your prompt changes to show the environment name:

```
(.venv) $
```

Now `python` and `pip` operate inside the environment. Packages you install go here and nowhere else.

## Installing Packages

```bash
pip install pandas requests
```

Check what's installed:

```bash
pip list
```

## Freezing Dependencies

To make your project reproducible, capture the exact versions of every package:

```bash
pip freeze > requirements.txt
```

This produces a file like:

```
numpy==2.2.4
pandas==2.2.3
python-dateutil==2.9.0
pytz==2025.2
requests==2.32.3
six==1.17.0
tzdata==2025.2
```

Commit `requirements.txt` to version control. Anyone who clones the project can recreate the exact same environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Deactivating

```bash
deactivate
```

This restores your shell's original `PATH`. The environment still exists on disk — you just aren't using it right now.

## Deleting an Environment

A virtual environment is just a directory. Delete it like any other folder:

```bash
rm -rf .venv
```

Recreate it from `requirements.txt` whenever you need it back.

## What Goes in .gitignore

Never commit the virtual environment itself. Add this to `.gitignore`:

```
.venv/
```

The environment is machine-specific and can weigh hundreds of megabytes. The `requirements.txt` file is all you need to reconstruct it.

## A Typical Project Setup

Here's the full workflow from scratch:

```bash
mkdir my-project && cd my-project
python3 -m venv .venv
source .venv/bin/activate
pip install pandas requests
pip freeze > requirements.txt
```

From this point forward, every time you work on the project:

```bash
source .venv/bin/activate   # at the start of a session
deactivate                  # when done
```

## Why .venv and Not virtualenv or conda

`venv` is built into Python 3.3+. There is no install step, no additional dependency, nothing to manage. It covers the vast majority of use cases.

`virtualenv` is a third-party tool that predates `venv` and adds a few features (faster creation, support for older Python versions). Not necessary for most projects.

`conda` is a different beast — it manages Python itself plus non-Python packages (C libraries, etc.) and is common in data science. Use it if you need it, but for general Python work, `venv` is simpler.

## Checking Which Python You're Using

If you're ever unsure whether you're inside an environment:

```bash
which python    # macOS / Linux
where python    # Windows
```

A path containing `.venv` means you're inside the environment. A system path like `/usr/bin/python3` means you're not.

Virtual environments are a small habit with a large payoff. Set one up at the start of every project and you'll never deal with dependency conflicts again.

## Next Steps

- **[Python & Pandas for Data Wrangling](/article/python-pandas-data-wrangling/)** — The first thing to install in your new virtual environment: pandas for data manipulation.
- **[Building Your First Data Pipeline](/article/building-your-first-data-pipeline/)** — Applying the project structure and dependency isolation from this article in a real end-to-end pipeline.
- **[Getting Started with Data Collection](/article/getting-started-with-data/)** — Where to begin once your Python environment is set up and you are ready to pull real data.
