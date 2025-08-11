# Changelog

## [2.0.1] - 2025-08-11

### Changed
- Removed console.log for better user experience.

## [2.0.0] - 2025-08-11

### Added
- **Full Markdown content support** - Major new feature for highlighting text in Markdown documents
  - New `markdownContent` prop as an alternative to HTML children
  - Automatic rendering of Markdown to HTML using the `marked` library
  - Tag positions stored as actual Markdown source file positions (including formatting characters)
  - Support for highlighting text that spans across Markdown formatting (bold, italic, links, etc.)
  - Complete support for all standard Markdown features:
    - Headers (H1-H6)
    - Bold and italic text
    - Links with URLs
    - Inline code and code blocks
    - Lists (ordered and unordered)
    - Tables
    - Mixed and nested formatting

### Changed
- `HiLiteContent` now accepts either `children` (HTML) or `markdownContent` (Markdown string)
- Enhanced position mapping system to handle both HTML and Markdown content
- Updated TypeScript types to support the new Markdown mode

### Technical Implementation
- New `MarkdownMapper` utility class for handling Markdown parsing and position mapping
- Bidirectional mapping between Markdown source positions and rendered HTML text positions
- Intelligent handling of Markdown syntax characters during text selection
- Preservation of exact file positions for database storage and retrieval

### Developer Experience
- Seamless integration - existing HTML mode continues to work without changes
- Import Markdown files directly with Vite/Webpack using `import content from "./file.md?raw"`
- Comprehensive position tracking for accurate tag restoration
- Full backward compatibility - no breaking changes for existing users

### Documentation
- Added comprehensive Markdown usage guide to README
- Updated API reference with new `markdownContent` prop
- Added examples for both inline Markdown strings and file imports
- Detailed explanation of how Markdown indexing works

---

## [1.3.4] - 2025-06-19

### Added
- Support for applying multiple tags to the same text selection
- Improved marker state management for multiple tag scenarios

### Changed
- Refactored `performHilite` to maintain selection after DOM updates
- Updated documentation with examples for creating multiple tags

---

## [1.3.3] - 2025-06-19

### Changed
- `type.ts` : Fix typing issue for removeTag method.

---

## [1.3.2] - 2025-06-19

### Added
- Complete CRUD operation support with HiLiteData return values:
  - Create: Enhanced `hiliteTag` returns creation data
  - Read: Improved `getAllTags` for comprehensive tag retrieval
  - Update: Enhanced `updateTag` returns updated tag data
  - Delete: New return value for `removeTag` with deletion data
- Comprehensive database synchronization support
- Full TypeScript type safety for all operations

### Changed
- `removeTag` now returns HiLiteData for better database integration
- Updated documentation with detailed CRUD operation examples
- Enhanced code examples showing database synchronization
- Step-by-step guiding for each CRUD operation

---

## [1.3.1] - 2025-06-19

### Added
- New `hoverColor` property for TagDefinition to customize hover state appearance
- Improved hover interaction behavior for better user experience
- Enhanced marker selection persistence until explicitly cleared

### Changed
- Updated documentation with comprehensive customization examples
- Added detailed explanation of the new hover styling feature in README
- Improved marker state management for more consistent behavior

---

## [1.3.0] - 2025-06-19

### Added
- New HiLiteData functionality for creating and updating tags directly
- Improved tag management system with UpdateTags feature
- Enhanced Developer Experience (DX)

### Changed
- Major restructuring of project for better organization and maintainability
- Significant code cleanup and optimization
- Updated documentation for easier onboarding and implementation
- Improved absolute path handling

### Fixed
- Major improvements in handling overlapping/nested tags
- Enhanced tag removal logic for nested tags
- Fixed tag restoration functionality
- Resolved issues with tag selection in nested scenarios
- Various important bug fixes related to HiLiteData

### Initial Features
- Core highlighting functionality
- Basic tag management system
- Tag selection utilities
- Range wrapping with markers

---

## [v1.2.0] - 2025-06-18

### New Update Tags feature

#### Added
- New `updateTag` method to change the tag type of existing highlights
- Comprehensive debugging warnings in development mode to help identify common issues
- New Developer Experience & Debugging section in documentation

#### Improved
- Enhanced documentation with clearer examples and better structure
- Added detailed explanations for new users in the README
- Better error messages and warnings for tag definition validation
- More detailed API reference with props descriptions

---

## [1.1.3] - 2025-06-18

### Added
- Support for overlapping and nested tags
  - New `overlapTag` prop to enable overlapping highlights
  - Proper serialization and restoration of nested tag structures
  - Smart handling of overlapping tag boundaries

- Built-in marker selection handling
  - New `onMarkerSelect` prop for handling marker selection
  - Automatic cursor styling for clickable markers
  - Smart selection of nested tags (inner tags selected before outer ones)

### Improved
- Tag restoration
  - More reliable restoration of overlapping tags
  - Preservation of original marker IDs when restoring
  - Better handling of marker-start and marker-end classes

- Selection behavior
  - Smarter selection of overlapping markers
  - Automatically selects innermost (shortest) tag first
  - Better user experience when removing nested tags

### Fixed
- Fixed issue where overlapping tags were merged during serialization
- Fixed marker ID preservation during tag restoration
- Fixed nested tag structure handling in getAllTags and restoreTags

### No Breaking Changes
All new features are opt-in and backward compatible.

### To use the new features:

1. For overlapping tags:
```tsx
<HiLiteContent
  overlapTag={true}  // Enable overlapping tags
  // ... other props
>
```

2. For built-in marker selection:
```tsx
const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

<HiLiteContent
  selectedMarkerId={selectedMarkerId}
  onMarkerSelect={setSelectedMarkerId}
  // ... other props
>
```

### Example
Creating nested highlights:
```tsx
// First highlight "important"
ref.current?.hiliteTag(tag);

// Then highlight "important tests"
ref.current?.hiliteTag(tag);

// getAllTags() will now properly return both markers:
[
  {
    "markerId": "inner",
    "tagId": "2",
    "text": "important",
    "beginIndex": 20,
    "endIndex": 29
  },
  {
    "markerId": "outer",
    "tagId": "2",
    "text": "important tests",
    "beginIndex": 20,
    "endIndex": 35
  }
]
```

---

## [1.1.2] - 2025-06-11

A small maintenance release focusing on overlap rendering and whitespace handling.

### 🛠 Fixes & Improvements

- **Overlap CSS**  
  Refined nested/adjacent marker rules so highlights render seamlessly without visual gaps.

- **Whitespace Trimming**  
  Automatically trims leading/trailing spaces when wrapping across HTML nodes, preventing stray gaps or collapsed text.

- **General Fixes**  
  - Resolved a handful of edge-case tagging behaviors  
  - Improved stability when overlapping existing highlights  
  - Minor performance optimizations

---

## [1.1.1] - 2025-06-10

### Release Notes (June 2025)

#### 🚀 New Feature: `restoreTags`
- Added a new `restoreTags(tags: HighlightedTag[])` method to the HiLiteContent ref API.
- This allows you to restore all highlights from a JSON array (as returned by `getAllTags`), making it easy to persist and reload highlights from your database or files.
- The `HighlightedTag` type is now exported for type safety and better developer experience.

#### 🏷️ Tag & Marker Model Improvements
- **Tags** are now clearly separated from **markers** in the documentation and API. Tags are your business logic (with a unique `id`), while markers are the HTML elements used to visually represent highlights in the DOM.
- The `getAllTags()` method now returns a single entry per tag, with absolute `beginIndex` and `endIndex` values, making it robust even for repeated or nested text.
- Markers spanning multiple nodes are grouped under a single `markerId`, and the API makes it easy to select or remove the entire highlight.

#### 🛠️ Fixes & Improvements
- Improved type safety by exporting the `HighlightedTag` type and using it throughout the API and documentation.
- Updated the README with clear examples, best practices, and customization tips (including how to use `marker-start` and `marker-end` for custom borders).
- Fixed issues with restoring highlights, handling multi-node selections, and ensuring correct marker boundaries.
- Enhanced developer experience with better documentation and more robust serialization/deserialization logic.

---

## [1.0.1] - 2025-06-04

### 🎉 Initial Public Release

HiLiteTag is a flexible, modern React component for text highlighting and tagging in complex HTML. This is the first public release, providing a robust and extensible API for developers to add rich text annotation features to their applications.

#### ✨ Features

- **Highlight and Tag Text:**
  - Tag any text, even across nested HTML elements.
  - Supports custom tag colors, styles, and selection color.
  - Handles whitespace and word boundaries for precise tagging.

- **Tag Management:**
  - Define tags with unique IDs, names, colors, and custom styles.
  - Use `HiLiteTags` for easy tag lookup and management.

- **Selection and Removal:**
  - Select individual highlights (markers) and remove them by marker ID.
  - Selected marker color is handled automatically by the component.

- **Serialization:**
  - Extract all highlights for storage or sync with `getAllTags()`.
  - Each highlight includes marker ID, tag ID, text, and segment info.

- **TypeScript Support:**
  - Full type definitions for all public APIs.

- **Easy Integration:**
  - Simple API: `import { HiLiteContent, HiLiteTags, type TagDefinition } from "hilitetag";`
  - Works with React and Next.js projects.

#### 🚦 Usage Example

```tsx
import { useRef, useState } from "react";
import { HiLiteContent, HiLiteTags, type TagDefinition } from "hilitetag";

const tagDefs: TagDefinition[] = [
  { id: "1", name: "tag1", color: "rgba(255,255,0,0.4)", selectedColor: "rgba(255,255,0,0.8)", style: { fontWeight: "bold" } },
  { id: "2", name: "tag2", color: "rgba(255,100,100,0.4)", selectedColor: "rgba(255,100,100,0.8)", style: { fontStyle: "italic" } }
];
const tags = new HiLiteTags(tagDefs);

function App() {
  const ref = useRef<any>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  return (
    <div>
      <button onClick={() => ref.current?.highlightTag(tags.getByName("tag1"))}>Highlight as tag1</button>
      <button onClick={() => ref.current?.highlightTag(tags.getByName("tag2"))}>Highlight as tag2</button>
      <button onClick={() => ref.current?.removeTag(selectedMarkerId)} disabled={!selectedMarkerId}>Remove Selected Tag</button>
      <button onClick={() => {
        const tags = ref.current?.getAllTags();
        if (tags) alert(JSON.stringify(tags, null, 2));
      }}>Get All Tags</button>
      <HiLiteContent
        ref={ref}
        tags={tags}
        autoWordBoundaries
        autoTag
        defaultTag={tags.getByName("tag1")}
        selectedMarkerId={selectedMarkerId}
      >
        <div onClick={e => {
          const target = e.target as HTMLElement;
          if (target.classList.contains("marker")) {
            setSelectedMarkerId(target.getAttribute("data-marker-id"));
          } else {
            setSelectedMarkerId(null);
          }
        }}>
          <h1>Welcome</h1>
          <p>Thank you for using <b>HiLiteTag</b>.</p>
        </div>
      </HiLiteContent>
    </div>
  );
}
```