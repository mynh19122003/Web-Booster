import { deAuthMessages } from "./auth";
import { deCoachesMessages } from "./coaches";
import { deCommonMessages } from "./common";
import { deDialogsMessages } from "./dialogs";
import { deHomeMessages } from "./home";
import { deLayoutMessages } from "./layout";
import { dePagesMessages } from "./pages";
import { deRankMessages } from "./rank";
import { deRegionsMessages } from "./regions";
import { deServicesMessages } from "./services";
import { deSupportMessages } from "./support";

export const deMessages = {
  ...deAuthMessages,
  ...deCoachesMessages,
  ...deCommonMessages,
  ...deDialogsMessages,
  ...deHomeMessages,
  ...deLayoutMessages,
  ...dePagesMessages,
  ...deRankMessages,
  ...deRegionsMessages,
  ...deServicesMessages,
  ...deSupportMessages,
} as const;
