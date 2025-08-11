import { useRef, useState } from "react";
import { HiLiteContent } from "./core/HiLiteContent";
import { HiLiteTags } from "./components/tags";
import type { TagDefinition } from "./components/tags";
import type { HiLiteData } from "./components/types";
// Import markdown content from external file
import markdownContent from "./test-markdown.md?raw";
import "./App.css";

function App() {
  const ref = useRef<any>(null);
  const markdownRef = useRef<any>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState<boolean>(false);
  const [useMarkdown, setUseMarkdown] = useState<boolean>(false);

  // Example tag definitions with custom style
  const tagDefs: TagDefinition[] = [
    { 
      id: "1", 
      color: "rgba(255, 255, 0, 0.4)", 
      selectedColor: "rgba(255, 255, 0, 0.9)",
      hoverColor: "rgba(255, 255, 0, 0.6)", // Optional hover color 
      style: { fontWeight: "bold" }
    },
    {
      id: "2",
      color: "rgba(255, 100, 100, 0.4)",
      selectedColor: "rgba(255, 100, 100, 0.9)",
      hoverColor: "rgba(255, 100, 100, 0.6)", // Optional hover color
      style: { fontStyle: "italic" }
    }
  ];
  const tags = new HiLiteTags(tagDefs);

  // Handler to highlight a tag
  const handleHiliteTag = (tag: TagDefinition) => {
    const activeRef = useMarkdown ? markdownRef : ref;
    const tagData = activeRef.current?.hiliteTag(tag);
    if (tagData) {
      console.log("Tag Data:", tagData);
      console.log(`Text: "${tagData.text}"`);
      console.log(`Indexes: [${tagData.beginIndex}, ${tagData.endIndex}]`);
      
      // If in markdown mode, show what's at those positions in the file
      if (useMarkdown && markdownContent) {
        const extractedText = markdownContent.substring(tagData.beginIndex, tagData.endIndex);
        console.log(`Text at markdown positions [${tagData.beginIndex}, ${tagData.endIndex}]: "${extractedText}"`);
      }
    }
  };

  // Handler for when a tag is selected
  const handleTagSelect = (markerId: string | null) => {
    setSelectedMarkerId(markerId);
  };

  // Handler to remove selected tag
  const handleRemoveTag = () => {
    const activeRef = useMarkdown ? markdownRef : ref;
    if (selectedMarkerId && activeRef.current) {
      const removedTagData = activeRef.current.removeTag(selectedMarkerId);
      if (removedTagData) {
        console.log("Removed Tag Data:", removedTagData);
        // Here you can sync with your database
        // await deleteTagFromDatabase(removedTagData);
      }
      setSelectedMarkerId(null);
    }
  };

  // Handler to update selected tag
  const handleUpdateTag = (newTag: TagDefinition) => {
    const activeRef = useMarkdown ? markdownRef : ref;
    if (activeRef.current && selectedMarkerId) {
      const updatedTagData = activeRef.current.updateTag(selectedMarkerId, newTag);
      if (updatedTagData) {
        console.log("Updated Tag Data:", updatedTagData);
      }
      setSelectedMarkerId(null); // Clear selection after update
    }
  };

  // Handler to restore tags from tag.json
  const handleRestoreTags = async () => {
    const activeRef = useMarkdown ? markdownRef : ref;
    // For demo purposes, use different sample data for markdown
    if (useMarkdown) {
      // Example tags for markdown content with ACTUAL file positions
      const markdownTags: HiLiteData[] = [
        {
          markerId: "demo1",
          tagId: "1",
          text: "work too",
          beginIndex: 227,  // Actual position in markdown file
          endIndex: 235
        },
        {
          markerId: "demo2",
          tagId: "2",
          text: "spans across bold",
          beginIndex: 544,
          endIndex: 565
        }
      ];
      activeRef.current?.restoreTags(markdownTags);
    } else {
      // Dynamically load tag.json and restore tags for HTML
      const resp = await fetch("/src/tag.json");
      if (resp.ok) {
        const tagsJson: HiLiteData[] = await resp.json();
        activeRef.current?.restoreTags(tagsJson);
      } else {
        alert("Failed to load tag.json");
      }
    }
  };

  // Handle adding multiple tags
  const handleAddMultipleTags = () => {
    const activeRef = useMarkdown ? markdownRef : ref;
    // This will work for applying multiple tags to the same selection
    ['1', '2'].forEach(tagId => {
      const tag = tags.getById(tagId);
      const tagData = activeRef.current?.hiliteTag(tag);
      if (tagData) {
        // Handle the tag data (e.g., save to database)
        console.log('Created tag:', tagData);
      }
    });
  };

  return (
    <div>
      <img src="./src/highlighter.svg" alt="" width={50} height={50} style={{ padding: 16 }} />

      <div className="control-container" style={{ justifyContent: "space-between", display: "flex" }}>
        <button onClick={() => handleHiliteTag(tags.getById("1"))}>Highlight as tag-1</button>
        <button onClick={handleAddMultipleTags}>Add Multiple Tags (tag-1 & tag-2)</button>
        <button onClick={() => handleUpdateTag(tags.getById("2"))}>Update tag as tag-2</button>
        <button onClick={handleRemoveTag} disabled={!selectedMarkerId}>Remove Selected Tag</button>
        <button onClick={() => setShowAllTags(prev => !prev)}>
          {showAllTags ? "Hide All Tags" : "Show All Tags"}
        </button>
        <button onClick={handleRestoreTags}>Restore Tags</button>
      </div>
      
      <div style={{ marginTop: 20, marginBottom: 20, padding: 16, background: "#333", borderRadius: 8 }}>
        <label style={{ color: "#fff", marginRight: 10 }}>
          <input 
            type="checkbox" 
            checked={useMarkdown}
            onChange={(e) => {
              setUseMarkdown(e.target.checked);
              setSelectedMarkerId(null);
              setShowAllTags(false);
            }}
            style={{ marginRight: 5 }}
          />
          Use Markdown Mode
        </label>
        <span style={{ color: "#999", fontSize: 14, marginLeft: 10 }}>
          {useMarkdown ? "Tags will be indexed based on Markdown source" : "Tags will be indexed based on HTML"}
        </span>
      </div>

      <div style={{ textAlign: useMarkdown ? "left" : "inherit" }}>
        {!useMarkdown ? (
          <HiLiteContent
            ref={ref}
            tags={tags}
            autoWordBoundaries
            overlapTag
            defaultTag={tags.getById("1")}
            selectedMarkerId={selectedMarkerId}
            onMarkerSelect={handleTagSelect}
          >
            <div>
              <h1>Welcome to HiLiteTag</h1>
              <p>Thank you for <b>supporting</b> this project.</p>
            </div>
          </HiLiteContent>
        ) : (
          <HiLiteContent
            ref={markdownRef}
            tags={tags}
            autoWordBoundaries
            overlapTag
            defaultTag={tags.getById("1")}
            selectedMarkerId={selectedMarkerId}
            onMarkerSelect={handleTagSelect}
            markdownContent={markdownContent}
          />
        )}
      </div>
      
      {selectedMarkerId && <div style={{ color: "#fff", marginTop: 8 }}>Selected Marker ID: {selectedMarkerId}</div>}
      
      {showAllTags && (
        <div>
          <h2>All Tags</h2>
          <pre>{JSON.stringify((useMarkdown ? markdownRef : ref).current?.getAllTags(), null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
