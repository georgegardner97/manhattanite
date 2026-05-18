# Shared Knowledge Bases

A shared knowledge base lets you reuse the same reference material across multiple specialists — so you don't have to duplicate content when different specialists need access to the same knowledge.

## How It Works

When a knowledge base is marked as shared during creation:

1. The source files are saved to a central location: `_shared-kbs/{kb-name}/`
2. The specialist being built gets its own copy in `references/` (for portability)
3. Other specialists can connect to the same shared KB later

Each packaged specialist is always self-contained — it carries its own copy of the knowledge. The shared source is a convenience for building and updating, not a live link.

## When to Use Shared KBs

**Good candidates for sharing:**
- Company-wide style guides used by writing, marketing, and social specialists
- Product knowledge that applies across customer support, sales, and training specialists
- Industry frameworks referenced by multiple domain specialists

**Keep exclusive when:**
- The knowledge is highly specific to one specialist's purpose
- You want specialists to have different versions or subsets of the same material
- The KB is small and easy to recreate

## Managing Shared KBs

### Viewing shared KBs

Shared knowledge bases are stored in the user's projects folder under `_shared-kbs/`. Each has its own subfolder with the reference files inside.

### Updating a shared KB

To update content in a shared KB:
1. Edit the files in `_shared-kbs/{kb-name}/`
2. Rebuild any specialists that use this KB to pick up the changes

Note: Packaged specialists don't auto-update. The shared source is a convenience for the build process, not a live sync.

### Registry

A `registry.json` file in `_shared-kbs/` tracks which specialists are connected to which shared KBs. The builder maintains this automatically.

## Future Enhancements

Planned improvements to shared KBs (coming in Phase 3):
- Notion import directly into shared KBs
- A "refresh" command to push shared KB updates to all connected specialists in one step
- Better visualisation of which specialists share which KBs
