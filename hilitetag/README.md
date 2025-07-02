# HiLiteTag

A flexible, modern React component for text highlighting and tagging in complex HTML. Supports custom tags, colors, styles, selection/removal, overlapping tags, and easy serialization for storage.

Follow the project on [GitHub 🔗](https://github.com/hacoeur-24/HiLiteTag)

---

## Table of Contents
- [HiLiteTag](#hilitetag)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Tags vs Markers](#tags-vs-markers)
  - [How to use HiLiteTag](#how-to-use-hilitetag)
    - [1. Define Your Tags](#1-define-your-tags)
    - [2. Wrap content inside HiLiteContent](#2-wrap-content-inside-hilitecontent)
    - [3. Creating Tags](#3-creating-tags)
      - [Single Tag Creation](#single-tag-creation)
      - [Multiple Tags on Same Selection](#multiple-tags-on-same-selection)
    - [4. Selecting Tags](#4-selecting-tags)
    - [5. Removing Tags](#5-removing-tags)
    - [6. Updating Tags](#6-updating-tags)
    - [7. Getting Tags (Serialization)](#7-getting-tags-serialization)
    - [8. Restoring Tags from stored tags](#8-restoring-tags-from-stored-tags)
  - [Customization](#customization)
    - [Basic Colors](#basic-colors)
    - [Custom Styling](#custom-styling)
  - [API Reference](#api-reference)
    - [HiLiteContent Props](#hilitecontent-props)
    - [HiLiteTags](#hilitetags)
    - [HiLiteContent Ref Methods (CRUD + RESTORE)](#hilitecontent-ref-methods-crud--restore)
    - [Types](#types)
      - [TagDefinition](#tagdefinition)
  - [Best Practices \& Warnings](#best-practices--warnings)
  - [Developer Experience \& Debugging](#developer-experience--debugging)
  - [Features](#features)
  - [Local Development \& Example](#local-development--example)
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
import type { TagDefinition, HiLiteData, HiLiteRef } from "hilitetag";

function App() {
  // Use HiLiteRef type for better TypeScript support and autocompletion
  const hiliteRef = useRef<HiLiteRef>(null);

  // Example: TypeScript will now provide full type hints for all methods
  const handleHighlight = () => {
    if (hiliteRef.current) {
      const tagData = hiliteRef.current.hiliteTag(someTag); // TypeScript knows this returns HiLiteData | undefined
      if (tagData) {
        // TypeScript knows all the properties available on tagData
        console.log(tagData.markerId, tagData.beginIndex, tagData.text);
      }
    }
  };

  return (
    <HiLiteContent
      ref={hiliteRef} // TypeScript enforces correct ref type
      // ...other props
    >
      // ...content
    </HiLiteContent>
  );
}
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
4.  Creating Tags
5.  Removing Tags
6.  Updating Tags
7.	Getting Tags (Serialization)
8.	Restoring Tags from stored tags

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

  return (
    <div>
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

### 3. Creating Tags

To create a tag simply use the method on ref called `hiliteTag(tag)`, it will add the tag to the selected Text. The `hiliteTag` method returns a `HiLiteData` object containing information about the tag, similar to `removeTag` and `updateTag`. This makes it easy to sync with your database.

#### Single Tag Creation

```tsx
import { useRef } from "react";
import { HiLiteContent, HiLiteTags, type TagDefinition } from "hilitetag";

function App() {
  const ref = useRef<any>(null);

  // ...tagDefs and tags...

  // Highlight selected text with a tag and get the tag data
  const handleHighlightTag = (tagId: string) => {
    if (!tags || !ref.current) return;

    const tag = tags.getById(tagId);
    const tagData = ref.current.hiliteTag(tag);

    if (tagData) {
      console.log('New tag data:', tagData);
      // You can save tagData to your database here
      // tagData is of type HiLiteData containing:
      // - markerId: string
      // - tagId: string
      // - text: string
      // - beginIndex: number
      // - endIndex: number
    }
  };

  return (
    <div>
      <button onClick={() => handleHighlightTag("1")}>Highlight as tag 1</button>
      <button onClick={handleMultipleTags}>Add Multiple Tags</button>
      <HiLiteContent
        ref={ref}
        tags={tags}
        autoWordBoundaries
        overlapTag  // Enable overlapping tags for multiple tag support
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

#### Multiple Tags on Same Selection

You can apply multiple tags to the same selected text. The library maintains the selection between tag applications, making it easy to create overlapping tags:

```tsx
// Apply multiple tags to the same selection
const handleAddMultipleTags = () => {
  // This will work for applying multiple tags to the same selection
  ['1', '2'].forEach(tagId => {
    const tag = tags.getById(tagId);
    const tagData = ref.current.hiliteTag(tag);
    if (tagData) {
      // Handle the tag data (e.g., save to database)
      console.log('Created tag:', tagData);
    }
  });
};

<button onClick={handleMultipleTags}>Add Multiple Tags</button>
```

This is particularly useful for:
- Applying multiple categories to the same text
- Creating tag combinations (e.g., "important" + "urgent")
- Building complex tagging systems with overlapping meanings
- Supporting multi-label classification of text

---

### 4. Selecting Tags

The library includes built-in support for selecting tags. Simply provide the `onMarkerSelect` prop and manage the selected state:

```tsx
const ref = useRef<any>(null);
const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

// ...

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

### 5. Removing Tags

The `removeTag` method returns a `HiLiteData` object containing information about the removed tag, similar to `hiliteTag` and `updateTag`. This makes it easy to sync removals with your database.

```tsx
const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

// ...

// Remove selected marker
const handleRemoveTag = () => {
  if (!selectedMarkerId || !ref.current) return;

  cosnt removedTagData = ref.current.removeTag(selectedMarkerId);
  setSelectedMarkerId(null);

  if (removedTagData) {
    console.log('Removed tag data:', removedTagData);
    // You can remove the tag in your database here
    // removedTagData is of type HiLiteData containing:
    // - markerId: string
    // - tagId: string (this will be the new tag's id)
    // - text: string
    // - beginIndex: number
    // - endIndex: number
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

### 6. Updating Tags

You can update existing highlighted Tags to use a different tag. This is useful for changing the appearance or meaning of existing highlights:

```tsx
// Handler to update selected tag and get the updated tag data
const handleUpdateTag = (newTag: TagDefinition) => {
  if (!selectedMarkerId || !ref.current) return;

  const updatedTagData = ref.current.updateTag(selectedMarkerId, newTag);

  if (updatedTagData) {
    console.log('Updated tag data:', updatedTagData);
    // You can update the tag in your database here
    // updatedTagData is of type HiLiteData containing:
    // - markerId: string
    // - tagId: string (this will be the new tag's id)
    // - text: string
    // - beginIndex: number
    // - endIndex: number
  }

  setSelectedMarkerId(null); // Clear selection after update
};

<button onClick={() => handleUpdateTag(tags.getById("2"))}>
  Update tag as tag-2
</button>
```

---

### 7. Getting Tags (Serialization)

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

---

### 8. Restoring Tags from stored tags

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

You can fully customize the appearance of your tags using several properties in your `TagDefinition`:

### Basic Colors
- `color`: The default background color of the tag
- `selectedColor`: The color applied when the tag is selected
- `hoverColor` (optional): The color applied when hovering over any part of the tag

The `hoverColor` property provides immediate visual feedback to users by highlighting all parts of a tag when hovering over any of its segments. This is particularly useful for:
- Improving user experience by clearly showing the full extent of a tag
- Making it easier to identify related segments of text that belong to the same tag
- Providing visual confirmation before selecting or removing a tag

### Custom Styling
You can use the `style` property for additional CSS customization. When working with borders or rounded corners, use the `marker-start` and `marker-end` classes to properly style the beginning and end of a tag. This ensures that highlights spanning multiple nodes look visually correct. _For borders you can create your own style to have transparent borders on the right and left side of each markers._

**Example with all customization options:**

```tsx
const tagDefs = [
  {
    id: "important",
    color: "rgba(255, 255, 0, 0.3)",      // Light yellow background
    selectedColor: "rgba(255, 255, 0, 0.9)", // Darker yellow when selected
    hoverColor: "rgba(255, 255, 0, 0.4)",   // Medium yellow on hover
    style: {
      fontWeight: "bold"
    }
  }
];
```

**Example CSS for borders and rounded corners:**

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

### HiLiteContent Ref Methods (CRUD + RESTORE)
- *CREATE* : `hiliteTag(tag?: TagDefinition)`: Highlight the current selection with the given tag. Returns a `HiLiteData` object containing the newly created tag's data, which can be used to save the tag to your database.

- *READ* : `getAllTags()`: Get all highlights as an array of **HiLiteData** type:
  ```ts
  type HiLiteData = {
    markerId: string;
    tagId: string;
    text: string;
    beginIndex: number;
    endIndex: number;
  };
  ```

- *UPDATE* : `updateTag(markerId: string, newTag: TagDefinition)`: Update an existing highlight with a new tag. This changes both the visual appearance and the underlying `data-tag-id`. Returns a `HiLiteData` object containing the updated tag's data, which can be used to update the tag in your database.

- *DELETE* : `removeTag(markerId: string)`: Remove a specific highlight by marker id. Returns a `HiLiteData` object containing the removed tag's data, which can be used to remove the tag from your database.

- *RESTORE* : `restoreTags(tags: HiLiteData[])`: Restore highlights from a saved array.

### Types

#### TagDefinition
```typescript
type TagDefinition = {
  id: string;            // Unique identifier for the tag
  color: string;         // Default background color
  selectedColor: string; // Color when tag is selected
  hoverColor?: string;   // Optional color when hovering over the tag
  style?: CSSProperties; // Optional custom CSS styles
};
```

The `hoverColor` and `style` properties are optional and provides better visual feedback and flexibilty for a custom design.

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

HiLiteTag provides comprehensive debugging information through browser console warnings to help you identify and fix issues during development or in production:

- Invalid tag definitions (missing properties, duplicate IDs)
- Invalid selections
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
