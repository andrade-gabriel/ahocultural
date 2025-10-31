import d from "./default.json"
import header from "@/components/header/locale/index.json"
import event from "@/features/panel/event/locale/index.json";

export const resources = {
    en: {
        header: header["en"],
        event: event["en"],
        default: d["en"],
    },
    pt: {
        header: header["pt"],
        event: event["pt"],
        default: d["pt"],
    },
    es: {
        header: header["pt"],
        event: event["es"],
        default: d["es"],
    },
};

export const namespaces = Object.keys(resources["pt"]);

export type ResourcesType = {
    event: typeof resources.en.event;
    default: typeof resources.en.default;
    header: typeof resources.en.header;
};
