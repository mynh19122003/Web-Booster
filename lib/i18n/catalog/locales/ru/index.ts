import { ruAuthMessages } from "./auth";
import { ruCoachesMessages } from "./coaches";
import { ruCommonMessages } from "./common";
import { ruDialogsMessages } from "./dialogs";
import { ruHomeMessages } from "./home";
import { ruLayoutMessages } from "./layout";
import { ruPagesMessages } from "./pages";
import { ruRankMessages } from "./rank";
import { ruRegionsMessages } from "./regions";
import { ruServicesMessages } from "./services";
import { ruSupportMessages } from "./support";

export const ruMessages = {
  ...ruAuthMessages,
  ...ruCoachesMessages,
  ...ruCommonMessages,
  ...ruDialogsMessages,
  ...ruHomeMessages,
  ...ruLayoutMessages,
  ...ruPagesMessages,
  ...ruRankMessages,
  ...ruRegionsMessages,
  ...ruServicesMessages,
  ...ruSupportMessages,
} as const;
