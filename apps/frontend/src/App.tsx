import { useState } from "react";
import { Layout, type AppView } from "./components/layout/Layout";
import { ClassificationView } from "./views/ClassificationView";
import { HyperplaneView } from "./views/HyperplaneView";
import { ImportView } from "./views/ImportView";

function App() {
  const [currentView, setCurrentView] = useState<AppView>("import");

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === "import" && <ImportView />}
      {currentView === "classification" && <ClassificationView />}
      {currentView === "hyperplane" && <HyperplaneView />}
    </Layout>
  );
}

export default App;
