import { useState } from "react";
import { ClassificationView } from "./views/ClassificationView";
import { ImportView } from "./views/ImportView";

type AppView = "import" | "classification";

function App() {
  const [currentView, setCurrentView] = useState<AppView>("import");

  return (
    <>
      {currentView === "import" && <ImportView onNavigate={setCurrentView} />}
      {currentView === "classification" && (
        <ClassificationView onNavigate={setCurrentView} />
      )}
    </>
  );
}

export default App;
