import { arAuthMessages } from "./auth";
import { arCoachesMessages } from "./coaches";
import { arCommonMessages } from "./common";
import { arDialogsMessages } from "./dialogs";
import { arHomeMessages } from "./home";
import { arLayoutMessages } from "./layout";
import { arPagesMessages } from "./pages";
import { arRankMessages } from "./rank";
import { arRegionsMessages } from "./regions";
import { arServicesMessages } from "./services";
import { arSupportMessages } from "./support";

export const arMessages = {
  ...arAuthMessages,
  ...arCoachesMessages,
  ...arCommonMessages,
  ...arDialogsMessages,
  ...arHomeMessages,
  ...arLayoutMessages,
  ...arPagesMessages,
  ...arRankMessages,
  ...arRegionsMessages,
  ...arServicesMessages,
  ...arSupportMessages,
} as const;
