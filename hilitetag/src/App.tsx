import { useRef, useState } from "react";
import { HiLiteContent } from "@/components/HiLiteContent";
import { HiLiteTags } from "@/core/tags";
import type { TagDefinition } from "@/core/tags";
import "./App.css";

function App() {
  const ref = useRef<any>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Example tag definitions with custom style
  const tagDefs: TagDefinition[] = [
    { id: "1", name: "tag1", color: "rgba(255, 255, 0, 0.4)", selectedColor: "rgba(255, 255, 0, 0.8)", style: { fontWeight: "bold" }},
    { id: "2", name: "tag2", color: "rgba(255, 100, 100, 0.4)", selectedColor: "rgba(255, 100, 100, 0.8)", style: { fontStyle: "italic" }}
  ];
  const tags = new HiLiteTags(tagDefs);

  // Handler to select a tag when a marker is clicked
  const handleTagClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("marker")) {
      const tagId = target.getAttribute("data-tag-id");
      setSelectedTagId(tagId);
    } else {
      setSelectedTagId(null);
    }
  };

  // Handler to remove selected tag
  const handleRemoveTag = () => {
    if (selectedTagId && ref.current) {
      ref.current.removeTag(selectedTagId);
      setSelectedTagId(null);
    }
  };

  // Apply selectedColor to selected tag
  if (typeof window !== "undefined") {
    setTimeout(() => {
      document.querySelectorAll(".marker").forEach(el => {
        const tagId = el.getAttribute("data-tag-id");
        const tag = tags.getById(tagId || "");
        if (tagId && tag && tag.selectedColor && tagId === selectedTagId) {
          (el as HTMLElement).style.background = tag.selectedColor;
        } else if (tag && tag.color) {
          (el as HTMLElement).style.background = tag.color;
        }
      });
    }, 0);
  }

  return (
    <div>
      <button onClick={() => ref.current?.highlightTag(tags.getByName("tag1"))}>Highlight as tag1</button>
      <button onClick={() => ref.current?.highlightTag(tags.getByName("tag2"))}>Highlight as tag2</button>
      <button onClick={handleRemoveTag} disabled={!selectedTagId}>Remove Selected Tag</button>
      <HiLiteContent
        ref={ref}
        tags={tags}
        autoWordBoundaries
        autoTag
        defaultTag={tags.getByName("tag2")}
      >
        <div onClick={handleTagClick} style={{ cursor: "pointer" }}>
          <h1>Welcome</h1>
          <p>We are doing <b>important</b> tests here.</p>
        </div>
      </HiLiteContent>
      {selectedTagId && <div style={{ color: "#fff", marginTop: 8 }}>Selected Tag ID: {selectedTagId}</div>}
    </div>
  );
}

export default App;
