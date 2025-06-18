# HiLiteTag

A flexible, modern React component for text highlighting and tagging in complex HTML. Supports custom tags, colors, styles, selection/removal, overlapping tags, and easy serialization for storage.

---

## Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Tags vs Markers](#tags-vs-markers)
- [How to use](#component-usage)
  - [1. Define Your Tags](#1-define-your-tags)
  - [2. Basic Highlighting](#2-basic-highlighting)
  - [3. Selecting and Removing Highlights](#3-selecting-and-removing-highlights)
  - [4. Getting All Tags (Serialization)](#4-getting-all-tags-serialization)
  - [5. Restoring Tags](#5-restoring-tags)
- [Customization](#customization)
- [API Reference](#api-reference)
- [Best Practices & Warnings](#best-practices--warnings)
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
  
1.	Define your tags.
2.	Wrap your content in HiLiteContent.
3.	Call hiliteTag(tag) on selection.
4.	Handle tag selection and removal.
5.	Extract highlights and store them.
6.	Re-apply stored highlights.

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

### 2. Basic Highlighting

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
          <h1>Welcome</h1>
          <p>Thank you for using <b>HiLiteTag</b>.</p>
        </div>
      </HiLiteContent>
    </div>
  );
}
```

### 3. Selecting and Removing Highlights

The library includes built-in support for selecting markers. Simply provide the `onMarkerSelect` prop and manage the selected state:

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
        <p>We are doing <b>important</b> tests here.</p>
      </div>
    </HiLiteContent>
  </>
);
```

Optionnaly you can also create a seperate function to add other behaviour like a custom menu:
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

### 4. Getting All Tags (Serialization)

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

### 5. Restoring Tags

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