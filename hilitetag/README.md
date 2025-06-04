# HiLiteTag

A flexible, modern React component for text highlighting and tagging in complex HTML. Supports custom tags, colors, styles, selection/removal, and easy serialization for storage.

---

## Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Component Usage](#component-usage)
  - [1. Define Your Tags](#1-define-your-tags)
  - [2. Basic Highlighting](#2-basic-highlighting)
  - [3. Selecting and Removing Highlights](#3-selecting-and-removing-highlights)
  - [4. Getting All Tags (Serialization)](#4-getting-all-tags-serialization)
- [API Reference](#api-reference)
- [Best Practices & Warnings](#best-practices--warnings)
- [Features](#features)
- [License](#license)

---

## Installation

```bash
npm install hilitetag
```

---

## Quick Start

Import the main components and types:

```tsx
import { HiLiteContent, HiLiteTags, type TagDefinition } from "hilitetag";
```

---

## Component Usage

### 1. Define Your Tags

Tags control the color, style, and identity of each highlight. You can use CSS color strings.

```ts
const tagDefs: TagDefinition[] = [
  {
    id: "1",
    name: "tag1",
    color: "rgba(255,255,0,0.4)",
    selectedColor: "rgba(255,255,0,0.8)", // Optional
    style: { fontWeight: "bold" } // Optional
  },
  {
    id: "2",
    name: "tag2",
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
import { useRef, useState } from "react";
import { HiLiteContent, HiLiteTags, type TagDefinition } from "hilitetag";

function App() {
  const ref = useRef<any>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  // ...tagDefs and tags as above...

  // Handler to add Tag
  const handleHighlightTag = (tagId: string) => {
    const tag = tags.getById(tagId);
    if (ref.current) {
      ref.current.highlightTag(tag);
      setSelectedMarkerId(null); // Reset selection after highlighting
    }
  };

  return (
    <div>
      <button onClick={() => handleHighlightTag("tag1")}>Highlight as tag1</button>
      <button onClick={() => handleHighlightTag("tag2")}>Highlight as tag2</button>
      <HiLiteContent
        ref={ref}
        tags={tags}
        selectedMarkerId={selectedMarkerId}
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

You can let users select a highlight (marker) and remove it:

```tsx
const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

// Select marker on click
const handleTagClick = (e: React.MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains("marker")) {
    setSelectedMarkerId(target.getAttribute("data-marker-id"));
  } else {
    setSelectedMarkerId(null);
  }
};

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
    <HiLiteContent ...>
        <div onClick={handleTagClick} style={{ cursor: "pointer" }}>...</div>
    </HiLiteContent>
  </>
);
```

### 4. Getting All Tags (Serialization)

You can extract all highlights for storage or sync:

```tsx
<button onClick={() => {
  const tags = ref.current?.getAllTags();
  if (tags) {
    // For demo: log to console, but you can send to your API/DB
    console.log("All tags:", tags);
    alert(JSON.stringify(tags, null, 2));
  }
}}>
  Get All Tags
</button>
```

Each tag object includes:
- `markerId`: Unique for each highlight
- `tagId`: The tag type
- `text`: The highlighted text
- `isStart`/`isEnd`: Whether this is the start/end of a multi-node highlight

---

## API Reference

### TagDefinition
```ts
type TagDefinition = {
  id: string;
  name: string;
  color: string | { r: number; g: number; b: number; a?: number };
  selectedColor?: string | { r: number; g: number; b: number; a?: number };
  style?: React.CSSProperties;
};
```

### HiLiteTags
- `new HiLiteTags(tagDefs: TagDefinition[])`: Create a tag manager.
- `.getByName(name: string)`: Get a tag by name.
- `.getById(id: string)`: Get a tag by id.
- `.getAll()`: Get all tags.

### HiLiteContent Props
- `tags: HiLiteTags` (**required**)
- `defaultTag?: TagDefinition` (required if `autoTag` is true)
- `autoWordBoundaries?: boolean`
- `autoTag?: boolean`
- `overlapTag?: boolean` --experimental (not stable)
- `selectedMarkerId?: string | null` (for selected color logic)
- `children: React.ReactNode`

### HiLiteContent Ref Methods
- `highlightTag(tag?: TagDefinition)`: Highlight the current selection with the given tag.
- `removeTag(markerId: string)`: Remove a specific highlight by marker id.
- `getAllTags()`: Get all highlights as an array:
  ```ts
  type HighlightedTag = {
    markerId: string | null;
    tagId: string | null;
    text: string | null;
    isStart: boolean;
    isEnd: boolean;
  };
  ```

---

## Best Practices & Warnings

- **Always provide a unique `id` for each tag in your `TagDefinition`.**
- **If you use `autoTag`, you must provide a `defaultTag`.**
- **Do not set `borderRadius` in your tag style if you want the default pill look.**
- **Highlights are tracked by unique `markerId`, not by tag type.**
- **If you want to persist highlights, use `getAllTags()` and store the result.**
- **To restore highlights, you must re-render the content and re-apply tags using your stored data.**
- **Whitespace-only selections are ignored.**
- **Selections spanning multiple nodes are supported.**
- **Selected marker color is handled automatically by the component.**

---

## Features
- Tag any text, even across nested HTML.
- Custom tag colors, styles, and selection color.
- Remove individual highlights.
- Serialize all highlights for storage or sync.
- Handles whitespace and word boundaries.
- Supports both CSS color strings and `{r,g,b,a}` color objects.
- No manual color switching needed for selected markers.

---

## License
MIT