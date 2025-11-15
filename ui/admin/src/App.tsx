import { Navigate, Route, Routes } from "react-router";

/** ACESS */
import { AccessLayout } from "@/features/access/layout";
import { LoginLayout } from "@/features/access/login";

/** PANEL */
import { PanelLayout } from "@/features/panel/layout";

/** INSTITUTIONAL */
import { AboutLayout } from '@/features/panel/about'
import { AdvertisementLayout } from '@/features/panel/advertisement'
import { ContactLayout } from "./features/panel/contact";
import { StudioLayout } from "./features/panel/studio";

/** CATEGORY */
import { CategoryLayout } from "./features/panel/category";
import { CategoryDetailLayout } from "./features/panel/category/detail";

/** LOCATION */
import { LocationLayout } from "./features/panel/location";
import { LocationDetailLayout } from "./features/panel/location/detail";

/** COMPANY */
import { CompanyLayout } from "./features/panel/company";
import { CompanyDetailLayout } from "./features/panel/company/detail";

/** ARTICLE */
import { ArticleLayout } from "./features/panel/article";
import { ArticleDetailLayout } from "./features/panel/article/detail";

/** EVENT */
import { EventLayout } from "./features/panel/event";
import { EventDetailLayout } from "./features/panel/event/detail";
import { HighlightEventLayout } from "./features/panel/highlight";

/** AD */
import { AdLayout } from "./features/panel/ad";
import { AdDetailLayout } from "./features/panel/ad/detail";

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
          <Route path="about">
            <Route index element={<AboutLayout />} />
          </Route>
          <Route path="advertisement">
            <Route index element={<AdvertisementLayout />} />
          </Route>
          <Route path="contact">
            <Route index element={<ContactLayout/>} />
          </Route>
          <Route path="studio">
            <Route index element={<StudioLayout/>} />
          </Route>
          <Route path="highlight">
            <Route index element={<HighlightEventLayout />} />
          </Route>
          <Route path="ads">
            <Route index element={<AdLayout />} />
            <Route path="new" element={<AdDetailLayout />} />
            <Route path=":id" element={<AdDetailLayout />} />
          </Route>
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
        {/* DEFAULT ROUTE */}
        <Route path="/" element={<Navigate to="/access" replace />} />
        {/* opcionalmente, captura 404 */}
        <Route path="*" element={<Navigate to="/access" replace />} />
      </Routes>
    </>
  )
}

export default App
