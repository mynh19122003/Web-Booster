import { daAuthMessages } from "./auth";
import { daCoachesMessages } from "./coaches";
import { daCommonMessages } from "./common";
import { daDialogsMessages } from "./dialogs";
import { daHomeMessages } from "./home";
import { daLayoutMessages } from "./layout";
import { daPagesMessages } from "./pages";
import { daRankMessages } from "./rank";
import { daRegionsMessages } from "./regions";
import { daServicesMessages } from "./services";
import { daSupportMessages } from "./support";

export const daMessages = {
  ...daAuthMessages,
  ...daCoachesMessages,
  ...daCommonMessages,
  ...daDialogsMessages,
  ...daHomeMessages,
  ...daLayoutMessages,
  ...daPagesMessages,
  ...daRankMessages,
  ...daRegionsMessages,
  ...daServicesMessages,
  ...daSupportMessages,
} as const;
