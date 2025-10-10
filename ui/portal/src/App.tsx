import { Navigate, Route, Routes } from "react-router";

/** PANEL */
import { PanelLayout } from './features/panel';

/** EVENT */
import { EventLayout } from './features/panel/event';
import { EventDetailLayout } from './features/panel/event/detail'

// import { SubwayLayout  } from "./features/panel/subway";

function App() {
  return (
    <>
      <Routes>
        <Route element={<PanelLayout />}>
          <Route path="event">
            <Route index element={<EventLayout />} />
            <Route path="new" element={<EventDetailLayout />} />
            <Route path=":id" element={<EventDetailLayout />} />
          </Route>
        </Route>
        {/* DEFAULT ROUTE */}
        {/* <Route path="/" element={<Navigate to="/access" replace />} /> */}
        {/* opcionalmente, captura 404 */}
        {/* <Route path="*" element={<Navigate to="/access" replace />} /> */}
      </Routes>
    </>
  )
}

export default App