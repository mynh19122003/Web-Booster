import { jaAuthMessages } from "./auth";
import { jaCoachesMessages } from "./coaches";
import { jaCommonMessages } from "./common";
import { jaDialogsMessages } from "./dialogs";
import { jaHomeMessages } from "./home";
import { jaLayoutMessages } from "./layout";
import { jaPagesMessages } from "./pages";
import { jaRankMessages } from "./rank";
import { jaRegionsMessages } from "./regions";
import { jaServicesMessages } from "./services";
import { jaSupportMessages } from "./support";

export const jaMessages = {
  ...jaAuthMessages,
  ...jaCoachesMessages,
  ...jaCommonMessages,
  ...jaDialogsMessages,
  ...jaHomeMessages,
  ...jaLayoutMessages,
  ...jaPagesMessages,
  ...jaRankMessages,
  ...jaRegionsMessages,
  ...jaServicesMessages,
  ...jaSupportMessages,
} as const;
