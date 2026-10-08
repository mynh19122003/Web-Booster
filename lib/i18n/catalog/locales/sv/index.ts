import { svAuthMessages } from "./auth";
import { svCoachesMessages } from "./coaches";
import { svCommonMessages } from "./common";
import { svDialogsMessages } from "./dialogs";
import { svHomeMessages } from "./home";
import { svLayoutMessages } from "./layout";
import { svPagesMessages } from "./pages";
import { svRankMessages } from "./rank";
import { svRegionsMessages } from "./regions";
import { svServicesMessages } from "./services";
import { svSupportMessages } from "./support";

export const svMessages = {
  ...svAuthMessages,
  ...svCoachesMessages,
  ...svCommonMessages,
  ...svDialogsMessages,
  ...svHomeMessages,
  ...svLayoutMessages,
  ...svPagesMessages,
  ...svRankMessages,
  ...svRegionsMessages,
  ...svServicesMessages,
  ...svSupportMessages,
} as const;
