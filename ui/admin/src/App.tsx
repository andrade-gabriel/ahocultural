import { Navigate, Route, Routes } from "react-router";

/** ACESS */
import { AccessLayout } from "@/features/access/layout";
import { LoginLayout } from "@/features/access/login";

/** PANEL */
import { PanelLayout } from "@/features/panel/layout";

/** CATEGORY */
import { CategoryLayout  } from "./features/panel/category";
import { CategoryDetailLayout } from "./features/panel/category/detail";

/** LOCATION */
import { LocationLayout  } from "./features/panel/location";
import { LocationDetailLayout } from "./features/panel/location/detail";

/** COMPANY */
import { CompanyLayout  } from "./features/panel/company";
import { CompanyDetailLayout } from "./features/panel/company/detail";

/** ARTICLE */
import { ArticleLayout  } from "./features/panel/article";
import { ArticleDetailLayout } from "./features/panel/article/detail";

/** EVENT */
import { EventLayout  } from "./features/panel/event";
import { EventDetailLayout  } from "./features/panel/event/detail";

// import { SubwayLayout  } from "./features/panel/subway";

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
            <Route path="new" element={<CategoryDetailLayout />} />
            <Route path=":id" element={<CategoryDetailLayout />} />
          </Route>
          <Route path="location">
            <Route index element={<LocationLayout />} />
            <Route path="new" element={<LocationDetailLayout />} />
            <Route path=":id" element={<LocationDetailLayout />} />
          </Route>
          <Route path="company">
            <Route index element={<CompanyLayout />} />
            <Route path="new" element={<CompanyDetailLayout />} />
            <Route path=":id" element={<CompanyDetailLayout />} />
          </Route>
          {/* <Route path="subway">
            <Route index element={<SubwayLayout />} />
          </Route> */}
          <Route path="article">
            <Route index element={<ArticleLayout />} />
            <Route path="new" element={<ArticleDetailLayout />} />
            <Route path=":id" element={<ArticleDetailLayout />} />
          </Route>
          <Route path="event">
            <Route index element={<EventLayout />} />
            <Route path="new" element={<EventDetailLayout />} />
            <Route path=":id" element={<EventDetailLayout />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/access" />} />
      </Routes>
    </>
  )
}

export default App
