# Changelog

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

### Breaking Changes
None. All new features are opt-in and backward compatible.

### Migration Guide
To use the new features:

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
