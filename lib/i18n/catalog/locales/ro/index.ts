import { roAuthMessages } from "./auth";
import { roCoachesMessages } from "./coaches";
import { roCommonMessages } from "./common";
import { roDialogsMessages } from "./dialogs";
import { roHomeMessages } from "./home";
import { roLayoutMessages } from "./layout";
import { roPagesMessages } from "./pages";
import { roRankMessages } from "./rank";
import { roRegionsMessages } from "./regions";
import { roServicesMessages } from "./services";
import { roSupportMessages } from "./support";

export const roMessages = {
  ...roAuthMessages,
  ...roCoachesMessages,
  ...roCommonMessages,
  ...roDialogsMessages,
  ...roHomeMessages,
  ...roLayoutMessages,
  ...roPagesMessages,
  ...roRankMessages,
  ...roRegionsMessages,
  ...roServicesMessages,
  ...roSupportMessages,
} as const;
