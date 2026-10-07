import { csAuthMessages } from "./auth";
import { csCoachesMessages } from "./coaches";
import { csCommonMessages } from "./common";
import { csDialogsMessages } from "./dialogs";
import { csHomeMessages } from "./home";
import { csLayoutMessages } from "./layout";
import { csPagesMessages } from "./pages";
import { csRankMessages } from "./rank";
import { csRegionsMessages } from "./regions";
import { csServicesMessages } from "./services";
import { csSupportMessages } from "./support";

export const csMessages = {
  ...csAuthMessages,
  ...csCoachesMessages,
  ...csCommonMessages,
  ...csDialogsMessages,
  ...csHomeMessages,
  ...csLayoutMessages,
  ...csPagesMessages,
  ...csRankMessages,
  ...csRegionsMessages,
  ...csServicesMessages,
  ...csSupportMessages,
} as const;
