import { useRef, useState } from "react";
import { HiLiteContent } from "./components/HiLiteContent";
import { HiLiteTags } from "./core/tags";
import type { TagDefinition, HighlightedTag } from "./core/tags";
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

  // Handler to select a tag when a marker is clicked
  const handleTagClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("marker")) {
      const markerId = target.getAttribute("data-marker-id");
      setSelectedMarkerId(markerId);
    } else {
      setSelectedMarkerId(null);
    }
  };

  // Handler to remove selected marker
  const handleRemoveTag = () => {
    if (selectedMarkerId && ref.current) {
      ref.current.removeTag(selectedMarkerId);
      setSelectedMarkerId(null);
    }
  };

  const handleRestoreTags = async () => {
    // Dynamically load tag.json and restore tags
    const resp = await fetch("/src/tag.json");
    if (resp.ok) {
      const tagsJson: HighlightedTag[] = await resp.json();
      ref.current?.restoreTags(tagsJson);
    } else {
      alert("Failed to load tag.json");
    }
  };

  return (
    <div>
      <div className="control-container" style={{ justifyContent: "space-between", display: "flex" }}>
        <button onClick={() => ref.current?.hiliteTag(tags.getById("1"))}>Highlight as tag1</button>
        <button onClick={() => ref.current?.hiliteTag(tags.getById("2"))}>Highlight as tag2</button>
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
        autoTag
        defaultTag={tags.getById("2")}
        selectedMarkerId={selectedMarkerId}
      >
        <div onClick={handleTagClick} style={{ cursor: "pointer" }}>
          <h1>Welcome</h1>
          <p>We are doing <b>important</b> tests here.</p>
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
