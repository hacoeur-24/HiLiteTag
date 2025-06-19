import { useRef, useState } from "react";
import { HiLiteContent } from "./core/HiLiteContent";
import { HiLiteTags } from "./components/tags";
import type { TagDefinition } from "./components/tags";
import type { HiLiteData } from "./components/types";
import "./App.css";

function App() {
  const ref = useRef<any>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState<boolean>(false);

  // Example tag definitions with custom style
  const tagDefs: TagDefinition[] = [
    { 
      id: "1", 
      color: "rgba(255, 255, 0, 0.4)", 
      selectedColor: "rgba(255, 255, 0, 0.8)", 
      style: { fontWeight: "bold" }
    },
    { 
      id: "2", 
      color: "rgba(255, 100, 100, 0.4)", 
      selectedColor: "rgba(255, 100, 100, 0.8)", 
      style: { fontStyle: "italic" }
    }
  ];
  const tags = new HiLiteTags(tagDefs);

  // Handler to highlight a tag
  const handleHiliteTag = (tag: TagDefinition) => {
    const tagData = ref.current.hiliteTag(tag);
    if (tagData) {
      console.log("Tag Data:", tagData);
    }
  };

  // Handler for when a tag is selected
  const handleTagSelect = (markerId: string | null) => {
    setSelectedMarkerId(markerId);
  };

  // Handler to remove selected tag
  const handleRemoveTag = () => {
    if (selectedMarkerId && ref.current) {
      ref.current.removeTag(selectedMarkerId);
      setSelectedMarkerId(null);
    }
  };

  // Handler to restore tags from tag.json
  const handleRestoreTags = async () => {
    // Dynamically load tag.json and restore tags
    const resp = await fetch("/src/tag.json");
    if (resp.ok) {
      const tagsJson: HiLiteData[] = await resp.json();
      ref.current?.restoreTags(tagsJson);
    } else {
      alert("Failed to load tag.json");
    }
  };

  // Handler to update selected tag
  const handleUpdateTag = (newTag: TagDefinition) => {
    if (ref.current && selectedMarkerId) {
      const updatedTagData = ref.current.updateTag(selectedMarkerId, newTag);
      if (updatedTagData) {
        console.log("Updated Tag Data:", updatedTagData);
      }
      setSelectedMarkerId(null); // Clear selection after update
    }
  };

  return (
    <div>
      <img src="./src/highlighter.svg" alt="" width={50} height={50} style={{ padding: 16 }} />
      <div className="control-container" style={{ justifyContent: "space-between", display: "flex" }}>
        <button onClick={() => handleHiliteTag(tags.getById("1"))}>Highlight as tag-1</button>
        <button onClick={() => handleUpdateTag(tags.getById("2"))}>Update tag as tag-2</button>
        <button onClick={handleRemoveTag} disabled={!selectedMarkerId}>Remove Selected Tag</button>
        <button onClick={() => setShowAllTags(prev => !prev)}>
          {showAllTags ? "Hide All Tags" : "Show All Tags"}
        </button>
        <button onClick={handleRestoreTags}>Restore Tags</button>
      </div>

      <HiLiteContent
        ref={ref}
        tags={tags}
        autoWordBoundaries
        overlapTag
        autoTag
        defaultTag={tags.getById("1")}
        selectedMarkerId={selectedMarkerId}
        onMarkerSelect={handleTagSelect}
      >
        <div>
          <h1>Welcome to HiLiteTag</h1>
          <p>Thank you for <b>supporting</b> this project.</p>
        </div>
      </HiLiteContent>
      {selectedMarkerId && <div style={{ color: "#fff", marginTop: 8 }}>Selected Marker ID: {selectedMarkerId}</div>}
      {/* I want this to show only when we click on getAllTags button */}
      {showAllTags && (
        <div>
          <h2>All Tags</h2>
          <pre>{JSON.stringify(ref.current?.getAllTags(), null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
