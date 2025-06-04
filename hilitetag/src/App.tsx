import { useRef } from "react";
import { HiLiteContent } from "@/components/HiLiteContent";
import { HiLiteTags } from "@/core/tags";
import type { TagDefinition } from "@/core/tags";
import "./App.css";

function App() {
  const ref = useRef<any>(null);

  // Example tag definitions with custom style
  const tagDefs: TagDefinition[] = [
    { id: "1", name: "tag1", color: "rgba(255, 255, 0, 0.4)"},
    { id: "2", name: "tag2", color: "rgba(255, 100, 100, 0.4)"}
  ];
  const tags = new HiLiteTags(tagDefs);

  return (
    <div>
      <button onClick={() => ref.current?.highlightSelection(tags.getByName("tag1"))}>Highlight as tag1</button>
      <button onClick={() => ref.current?.highlightSelection(tags.getByName("tag2"))}>Highlight as tag2</button>
      <HiLiteContent
        ref={ref}
        tags={tags}
        autoWordBoundaries
        autoTag
        defaultTag={tags.getByName("tag2")}
      >
        <h1>Welcome</h1>
        <p>We are doing <b>important</b> tests here.</p>
      </HiLiteContent>
    </div>
  );
}

export default App;
