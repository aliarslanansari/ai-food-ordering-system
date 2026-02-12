import { BrowserRouter, Route, Routes } from "react-router-dom";
import Browse from "./pages/Browse";
import Chat from "./pages/Chat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/browse" element={<Browse />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
