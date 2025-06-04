import { useRef, useState } from "react";
import { HiLiteContent } from "./components/HiLiteContent";
import { HiLiteTags } from "./core/tags";
import type { TagDefinition } from "./core/tags";
import "./App.css";

function App() {
  const ref = useRef<any>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Example tag definitions with custom style
  const tagDefs: TagDefinition[] = [
    { 
      id: "1", 
      name: "tag1", 
      color: "rgba(255, 255, 0, 0.4)", 
      selectedColor: "rgba(255, 255, 0, 0.8)", 
      style: { fontWeight: "bold" }
    },
    { 
      id: "2", 
      name: "tag2", 
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

  return (
    <div>
      <button onClick={() => ref.current?.highlightTag(tags.getByName("tag1"))}>Highlight as tag1</button>
      <button onClick={() => ref.current?.highlightTag(tags.getByName("tag2"))}>Highlight as tag2</button>
      <button onClick={handleRemoveTag} disabled={!selectedMarkerId}>Remove Selected Tag</button>
      <button onClick={() => {
        const tags = ref.current?.getAllTags();
        if (tags) {
          console.log("All tags:", tags);
          alert(JSON.stringify(tags, null, 2));
        }
      }}>Get All Tags</button>
      <HiLiteContent
        ref={ref}
        tags={tags}
        autoWordBoundaries
        autoTag
        defaultTag={tags.getByName("tag2")}
        selectedMarkerId={selectedMarkerId}
      >
        <div onClick={handleTagClick} style={{ cursor: "pointer" }}>
          <h1>Welcome</h1>
          <p>We are doing <b>important</b> tests here.</p>
        </div>
      </HiLiteContent>
      {selectedMarkerId && <div style={{ color: "#fff", marginTop: 8 }}>Selected Marker ID: {selectedMarkerId}</div>}
    </div>
  );
}

export default App;
