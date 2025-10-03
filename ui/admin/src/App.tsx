import { Navigate, Route, Routes } from "react-router";

/** ACESS */
import { AccessLayout } from "@/features/access/layout";
import { LoginLayout } from "@/features/access/login";

/** PANEL */
import { PanelLayout } from "@/features/panel/layout";
import { CategoryLayout  } from "./features/panel/category";
import { LocationLayout  } from "./features/panel/location";
import { CompanyLayout  } from "./features/panel/company";
import { CompanyDetailLayout } from "./features/panel/company/detail";
import { SubwayLayout  } from "./features/panel/subway";
import { ArticleLayout  } from "./features/panel/article";
import { EventLayout  } from "./features/panel/event";

function App() {
  return (
    <>
      <Routes>
        <Route element={<AccessLayout />}>
          <Route path="access">
            <Route index element={<LoginLayout />} />
          </Route>
        </Route>
        <Route element={<PanelLayout />}>
          <Route path="category">
            <Route index element={<CategoryLayout />} />
          </Route>
          <Route path="location">
            <Route index element={<LocationLayout />} />
          </Route>
          <Route path="company">
            <Route index element={<CompanyLayout />} />
            <Route path=":id" element={<CompanyDetailLayout />} /> {/* /company/{id} */}
          </Route>
          <Route path="subway">
            <Route index element={<SubwayLayout />} />
          </Route>
          <Route path="article">
            <Route index element={<ArticleLayout />} />
          </Route>
          <Route path="event">
            <Route index element={<EventLayout />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/access" />} />
      </Routes>
    </>
  )
}

export default App
