import { esAuthMessages } from "./auth";
import { esCoachesMessages } from "./coaches";
import { esCommonMessages } from "./common";
import { esDialogsMessages } from "./dialogs";
import { esHomeMessages } from "./home";
import { esLayoutMessages } from "./layout";
import { esPagesMessages } from "./pages";
import { esRankMessages } from "./rank";
import { esRegionsMessages } from "./regions";
import { esServicesMessages } from "./services";
import { esSupportMessages } from "./support";

export const esMessages = {
  ...esAuthMessages,
  ...esCoachesMessages,
  ...esCommonMessages,
  ...esDialogsMessages,
  ...esHomeMessages,
  ...esLayoutMessages,
  ...esPagesMessages,
  ...esRankMessages,
  ...esRegionsMessages,
  ...esServicesMessages,
  ...esSupportMessages,
} as const;
