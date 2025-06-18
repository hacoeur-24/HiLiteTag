# HiLiteTag

A flexible, modern React component for text highlighting and tagging in complex HTML. Supports custom tags, colors, styles, selection/removal, overlapping tags, and easy serialization for storage.

---

## Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Tags vs Markers](#tags-vs-markers)
- [How to use HiLiteTag](#how-to-use-hilitetag)
  - [1. Define Your Tags](#1-define-your-tags)
  - [2. Wrap content inside HiLiteContent](#2-wrap-content-inside-hilitecontent)
  - [3. Selecting Tags](#3-selecting-tags)
  - [4. Removing Tags](#4-removing-tags)
  - [5. Updating Tags](#5-updating-tags)
  - [6. Getting Tags (Serialization)](#6-getting-tags-serialization)
  - [7. Restoring Tags from stored tags](#7-restoring-tags-from-stored-tags)
- [Customization](#customization)
- [API Reference](#api-reference)
- [Best Practices & Warnings](#best-practices--warnings)
- [Developer Experience & Debugging](#developer-experience--debugging)
- [Features](#features)
- [Local Development & Example](#local-development--example)
- [License](#license)

---

## Installation

```bash
npm install hilitetag
```
```bash
# or with yarn
yarn add hilitetag
```

---

## Quick Start

Import the main components and types:

```tsx
import { HiLiteContent, HiLiteTags } from "hilitetag";
import type { TagDefinition, HiLiteData } from "hilitetag";
```

---

## Tags vs Markers

**Tags** are defined by you, the developer. Each tag must have a unique `id` (ideally matching your database or business logic) and controls the color, style, and identity of a highlight.

**Markers** are the HTML elements the library uses to visually represent a tag in the DOM. When you highlight text that spans multiple nodes (e.g., bold, italic, or nested elements), the library creates multiple marker elements for a single tag, all sharing the same `markerId`.

Think of Tags as your logical labels (e.g., “Important”, “Reviewed”), and Markers as the visual DOM elements that span the highlighted text. One tag might correspond to multiple markers if it crosses HTML elements.

**Example:**

Suppose you want to highlight the phrase: `We are trying to HiLite nodes.` where `HiLite` is bold:

```html
<p>
  We are trying to 
  <b>HiLite</b>
  nodes
</p>
```

After highlighting, the library will produce:

```html
<p>
  <span class="marker marker-start" data-marker-id="abc" data-tag-id="1">We are trying to </span>
  <b><span class="marker" data-marker-id="abc" data-tag-id="1">HiLite</span></b>
  <span class="marker marker-end" data-marker-id="abc" data-tag-id="1"> nodes</span>
</p>
```

All marker elements for a tag share the same `markerId`, allowing you to select or remove the entire tag, even if it spans multiple DOM nodes.

---

## How to use HiLiteTag

1.	Define your Tags
2.	Wrap content inside HiLiteContent
3.	Selecting Tags 
4.  Removing Tags
5.  Updating Tags
6.	Getting Tags (Serialization)
7.	Restoring Tags from stored tags

✅ Built-in TypeScript support – with helpful types like TagDefinition and HiLiteData.

---

### 1. Define Your Tags

Tags control the color, style, and identity of each highlight. You can use CSS color strings.

```ts
const tagDefs: TagDefinition[] = [
  {
    id: "1",
    color: "rgba(255,255,0,0.4)",
    selectedColor: "rgba(255,255,0,0.8)",
    style: { fontWeight: "bold" } // Optional
  },
  {
    id: "2",
    color: "rgba(255,100,100,0.4)",
    selectedColor: "rgba(255,100,100,0.8)",
    style: { fontStyle: "italic" }
  }
];
const tags = new HiLiteTags(tagDefs);
```

---

### 2. Wrap content inside HiLiteContent

Wrap your content in `HiLiteContent` and use the ref API to highlight selections:

```tsx
import { useRef } from "react";
import { HiLiteContent, HiLiteTags, type TagDefinition } from "hilitetag";

function App() {
  const ref = useRef<any>(null);

  // ...tagDefs and tags as above...

  // Highlight selected text with a tag
  const handleHighlightTag = (tagId: string) => {
    const tag = tags.getById(tagId);
    if (ref.current && tag) {
      ref.current.hiliteTag(tag);
    }
  };

  return (
    <div>
      <button onClick={() => handleHighlightTag("1")}>Highlight as tag 1</button>
      <HiLiteContent
        ref={ref}
        tags={tags}
        autoWordBoundaries
      >
        <div>
          <h1>Welcome to HiLiteTag</h1>
          <p>Thank you for <b>supporting</b> this project.</p>
        </div>
      </HiLiteContent>
    </div>
  );
}
```

---

### 3. Selecting Tags

The library includes built-in support for selecting tags. Simply provide the `onMarkerSelect` prop and manage the selected state:

```tsx
const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

return (
  <>
    <HiLiteContent
      ref={ref}
      tags={tags}
      selectedMarkerId={selectedMarkerId}
      onMarkerSelect={setSelectedMarkerId}
      overlapTag // This enables overlapping tags
    >
      <div>
        <h1>Welcome to HiLiteTag</h1>
        <p>Thank you for <b>supporting</b> this project.</p>
      </div>
    </HiLiteContent>
  </>
);
```

*Optionnaly* : you can also create a seperate function to show a custom menu:
```tsx
// Select marker on click
const handleTagSelect = (markerId: string | null) => {
  setSelectedMarkerId(markerId);
};

// HiLiteContent
...onMarkerSelect={handleTagSelect}
```

When `onMarkerSelect` is provided:
- Markers become clickable (cursor changes to pointer)
- Clicking a marker selects it
- For overlapping tags, the innermost (shortest) tag is selected first
- Clicking outside a marker deselects it

---

### 4. Removing Tags

```tsx
const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

// Remove selected marker
const handleRemoveTag = () => {
  if (selectedMarkerId && ref.current) {
    ref.current.removeTag(selectedMarkerId);
    setSelectedMarkerId(null);
  }
};

return (
  <>
    <button onClick={handleRemoveTag} disabled={!selectedMarkerId}>
        Remove Selected Tag
    </button>
    <HiLiteContent
      ref={ref}
      tags={tags}
      selectedMarkerId={selectedMarkerId}
      onMarkerSelect={setSelectedMarkerId}
      overlapTag  // Enable overlapping tags
    >
      <div>
        <h1>Welcome to HiLiteTag</h1>
        <p>Thank you for <b>supporting</b> this project.</p>
      </div>
    </HiLiteContent>
  </>
);
```

---

### 5. Updating Tags

You can update existing highlights to use a different tag. This is useful for changing the appearance or meaning of existing highlights:

```tsx
// Handler to update selected tag
const handleUpdateTag = (newTag: TagDefinition) => {
  if (ref.current && selectedMarkerId) {
    ref.current.updateTag(selectedMarkerId, newTag);
    setSelectedMarkerId(null); // Clear selection after update
  }
};

<button onClick={() => handleUpdateTag(tags.getById("2"))}>
  Update tag as tag-2
</button>
```

### 6. Getting Tags (Serialization)

You can extract all highlights for storage or sync:

```tsx
const handleGetAllTags = () => {
  const tags = ref.current?.getAllTags();
  if (tags) {
    // Save or send to your API/DB
    alert(JSON.stringify(tags, null, 2));
  }
};

<button onClick={handleGetAllTags}>Save Tags</button>
```

Each tag object includes:

- `markerId`: Unique for each highlight
- `tagId`: The tag used
- `text`: The highlighted text
- `beginIndex`: Start index of the tagged text in the plain content
- `endIndex`: End index of the tagged text in the plain content

Example output:

```json
[
  {
    "markerId": "abc123",
    "tagId": "1",
    "text": "Thank you for using HiLiteTag.",
    "beginIndex": 0,
    "endIndex": 28
  }
]
```

### 7. Restoring Tags from stored tags

You can restore highlights from a saved JSON array (from `getAllTags`). This is useful for loading highlights from a database or file. For this use the exported `HiLiteData` type for type safety when restoring tags:

```tsx
import type { HiLiteData } from "hilitetag";

const handleRestoreTags = async () => {
  // Load and restore tags from your db or file:
  const resp = await fetch("/tag.json");
  if (resp.ok) {
    const tagsJson: HiLiteData[] = await resp.json();
    ref.current?.restoreTags(tagsJson);
  } else {
    alert("Failed to load tag.json");
  }
};

<button onClick={handleRestoreTags}>Restore Tags</button>
```

---

## Customization

You can fully customize the appearance of your tags using the `style` property in your `TagDefinition`. If you want to add borders or rounded corners, use the `marker-start` and `marker-end` classes to only apply border-radius or border styles to the start and end of a tag. This ensures that highlights spanning multiple nodes look visually correct. _For borders you can create your own style to have transparent borders on the right and left side of each markers._

**Example:**

```css
.marker {
  border: 1px solid #ffd700;
}
.marker.marker-start {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}
.marker.marker-end {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}
```

## API Reference

### HiLiteContent Props
- `tags: HiLiteTags` (**required**)
- `children: React.ReactNode` (**required**)
- `autoWordBoundaries?: boolean` : To select the complete word automatically
- `autoTag?: boolean` : Apply a tag whenever a text is selected
- `defaultTag?: TagDefinition` (required if `autoTag` is true)
- `overlapTag?: boolean` : Allow multiple tagging on existing tags
- `selectedMarkerId?: string | null` : Currently selected marker ID
- `onMarkerSelect?: (markerId: string | null) => void` : Callback when a marker is clicked, provides built-in selection handling

### HiLiteTags
- `new HiLiteTags(tagDefs: TagDefinition[])` : Create a tag manager.

- `.getById(id: string)` : Get a tag by id.

- `.getAll()` : Get all tags.

### HiLiteContent Ref Methods
- `hiliteTag(tag?: TagDefinition)`: Highlight the current selection with the given tag.

- `removeTag(markerId: string)`: Remove a specific highlight by marker id.

- `updateTag(markerId: string, newTag: TagDefinition)`: Update an existing highlight with a new tag. This changes both the visual appearance and the underlying `data-tag-id`.

- `getAllTags()`: Get all highlights as an array of **HiLiteData** type:
  ```ts
  type HiLiteData = {
    markerId: string;
    tagId: string;
    text: string;
    beginIndex: number;
    endIndex: number;
  };
  ```

- `restoreTags(tags: HiLiteData[])`: Restore highlights from a saved array.

## Best Practices & Warnings

- **Always provide a unique `id` for each tag in your `TagDefinition`.**
- **If you use `autoTag`, you must provide a `defaultTag`.**
- **Enable `overlapTag` when you want to support nested highlights.**
- **For overlapping tags, inner tags are always selected first when clicked.**
- **Highlights are tracked by unique `markerId`, not by tag type.**
- **If you want to persist highlights, use `getAllTags()` and store the result.**
- **Whitespace-only selections are ignored.**
- **Selections spanning multiple nodes are supported.**
- **Selected marker color is handled automatically by the component.**
- **Use `marker-start` and `marker-end` classes for custom border styling.**

## Developer Experience & Debugging

HiLiteTag provides comprehensive debugging information through browser console warnings to help you identify and fix issues during development. The library will warn you about:

- Invalid tag definitions (missing properties, duplicate IDs)
- Empty or invalid selections
- Selection outside the component
- Invalid data structures when restoring tags
- Missing required props
- Edge cases and potential issues

Example warnings:
```
⚠️ No text selected for highlighting
⚠️ Tag definition missing required "color" property: {...}
⚠️ Selected text is outside the HiLiteContent component
⚠️ restoreTags called with an empty array
```

These warnings are non-blocking and only appear during development to help you:
- Identify common mistakes early
- Understand what went wrong
- Get suggestions on how to fix issues
- Validate input data structures
- Debug edge cases

## Features
- Tag any text, even across nested HTML.
- Supports overlapping and nested tags
- Smart marker selection (automatically selects inner tags first)
- Custom tag colors, styles, and selection color.
- Remove individual highlights.
- Serialize all highlights for storage or sync.
- Restore highlights from JSON.
- Handles whitespace and word boundaries.
- No manual color switching needed for selected markers.
- Easy integration with your own tag system or database.
- Built-in marker selection handling

## Local Development & Example

You can install and run the project locally to explore or test the highlighting features. There is a simple working example already set up in `App.tsx`.

```bash
git clone https://github.com/hacoeur-24/HiLiteTag.git
cd HiLiteTag
npm install
npm run dev
```

## License
MIT