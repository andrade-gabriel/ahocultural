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
          <Route path=":location">
            <Route path="eventos">
              <Route index element={<EventLayout />} />
              <Route path="hoje" element={<EventLayout />} />
              <Route path="esta-semana" element={<EventLayout />} />
              <Route path="fim-de-semana" element={<EventLayout />} />
              <Route path="aho-aconselha" element={<EventLayout />} />
              <Route path=":category">
                <Route index element={<EventLayout />} />
                <Route path=":id" element={<EventDetailLayout />} />
              </Route>
            </Route>
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