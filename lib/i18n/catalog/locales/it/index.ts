import { itAuthMessages } from "./auth";
import { itCoachesMessages } from "./coaches";
import { itCommonMessages } from "./common";
import { itDialogsMessages } from "./dialogs";
import { itHomeMessages } from "./home";
import { itLayoutMessages } from "./layout";
import { itPagesMessages } from "./pages";
import { itRankMessages } from "./rank";
import { itRegionsMessages } from "./regions";
import { itServicesMessages } from "./services";
import { itSupportMessages } from "./support";

export const itMessages = {
  ...itAuthMessages,
  ...itCoachesMessages,
  ...itCommonMessages,
  ...itDialogsMessages,
  ...itHomeMessages,
  ...itLayoutMessages,
  ...itPagesMessages,
  ...itRankMessages,
  ...itRegionsMessages,
  ...itServicesMessages,
  ...itSupportMessages,
} as const;
