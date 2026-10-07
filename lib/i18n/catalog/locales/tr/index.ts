import { trAuthMessages } from "./auth";
import { trCoachesMessages } from "./coaches";
import { trCommonMessages } from "./common";
import { trDialogsMessages } from "./dialogs";
import { trHomeMessages } from "./home";
import { trLayoutMessages } from "./layout";
import { trPagesMessages } from "./pages";
import { trRankMessages } from "./rank";
import { trRegionsMessages } from "./regions";
import { trServicesMessages } from "./services";
import { trSupportMessages } from "./support";

export const trMessages = {
  ...trAuthMessages,
  ...trCoachesMessages,
  ...trCommonMessages,
  ...trDialogsMessages,
  ...trHomeMessages,
  ...trLayoutMessages,
  ...trPagesMessages,
  ...trRankMessages,
  ...trRegionsMessages,
  ...trServicesMessages,
  ...trSupportMessages,
} as const;
