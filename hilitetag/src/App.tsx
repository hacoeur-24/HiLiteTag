import { useRef } from "react";
import { HiLiteContent } from "./components/HiLiteContent";
import "./App.css";

function App() {
  const ref = useRef<any>(null);

  return (
    <div>
      <HiLiteContent ref={ref} autoWordBoundaries autoTag overlapTag>
        <h1>Welcome</h1>
        <p>We are doing <b>important</b> tests here.</p>
      </HiLiteContent>
      <button onClick={() => ref.current?.highlightSelection()}>Highlight Selection</button>
    </div>
  );
}

export default App;
